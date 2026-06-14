'use server'

import {
  City,
  CreateProfessionalServiceDTO,
  LocationFiltersData,
  ProfessionalServiceBasic,
  ProfessionalServiceDetailResponse,
  ProfessionalServiceFilters,
  ProfessionalServicesListResponse,
  State,
  UpdateProfessionalServiceDTO,
} from '../interfaces/professional-service.interfaces'
import {
  getAllCities,
  getCitiesByState,
  getFeaturedServices,
  getMyServiceEligibility,
  getRecentServices,
  getServiceById,
  getServiceBySlug,
  getServiceStats,
  getServicesByUserId,
  getStates,
  listServices,
  searchServices,
  type ServiceEligibility,
} from '../server/services.server'
import { getServerClient } from '@/utils/supabase/server'
import {
  buildServiceInsertPayload,
  buildServiceUpdatePatch,
  extractCfImageId,
  extractStreamUid,
  slugify,
} from './service-action.helpers'
import {
  insertSubcategories,
  requireSession,
  revalidateService,
  uniqueServiceSlug,
} from './service-action.session'

// ============================================================================
// READ ACTIONS (callable from client hooks — delegate to the server read layer)
// ============================================================================

export async function listServicesAction(
  filters: ProfessionalServiceFilters = {},
): Promise<ProfessionalServicesListResponse> {
  return listServices(filters)
}

export async function getServiceByIdAction(id: string): Promise<ProfessionalServiceDetailResponse | null> {
  return getServiceById(id)
}

export async function getServiceBySlugAction(slug: string): Promise<ProfessionalServiceDetailResponse | null> {
  return getServiceBySlug(slug)
}

export async function searchServicesAction(query: string, limit = 10): Promise<ProfessionalServiceBasic[]> {
  return searchServices(query, limit)
}

export async function featuredServicesAction(limit = 6): Promise<ProfessionalServiceBasic[]> {
  return getFeaturedServices(limit)
}

export async function recentServicesAction(limit = 10): Promise<ProfessionalServiceBasic[]> {
  return getRecentServices(limit)
}

export async function serviceStatsAction(
  serviceId: string,
): Promise<{ totalReviews: number; averageRating: number; totalMedia: number }> {
  return getServiceStats(serviceId)
}

export async function servicesByUserIdAction(userId: string): Promise<ProfessionalServiceBasic[]> {
  // Owners see all of their own services (incl. non-public); everyone else sees
  // only PUBLIC+ACTIVE (RLS enforces this too).
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  return getServicesByUserId(userId, data.user?.id === userId)
}

export async function statesAction(): Promise<State[]> {
  return getStates()
}

export async function allCitiesAction(): Promise<City[]> {
  return getAllCities()
}

export async function citiesByStateAction(stateId: string): Promise<City[]> {
  return getCitiesByState(stateId)
}

export async function locationFiltersAction(): Promise<LocationFiltersData> {
  const [states, cities] = await Promise.all([getStates(), getAllCities()])
  return { states, cities }
}

export async function myEligibilityAction(): Promise<ServiceEligibility> {
  return getMyServiceEligibility()
}

// ============================================================================
// WRITE ACTIONS
// ============================================================================

export async function createServiceAction(
  dto: CreateProfessionalServiceDTO,
): Promise<ProfessionalServiceDetailResponse> {
  const { userId, client } = await requireSession()

  // PDF eligibility rule: only a verified professional profile may publish.
  const eligibility = await getMyServiceEligibility()
  if (!eligibility.eligible) {
    throw new Error(
      'Para publicar un servicio necesitas un perfil profesional con al menos un título o estudio verificado por la plataforma.',
    )
  }

  if (!dto.name?.trim()) throw new Error('El nombre del servicio es obligatorio.')

  const payload = buildServiceInsertPayload(userId, eligibility.professionalProfileId, dto)

  let slug = await uniqueServiceSlug(client, dto.name)
  let serviceId = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await client
      .from('professional_services')
      .insert({ ...payload, slug })
      .select('id, slug')
      .maybeSingle()
    if (!error && data) {
      serviceId = (data as { id: string; slug: string }).id
      break
    }
    // 23505 = unique_violation on slug; retry once with a randomized suffix.
    if ((error as { code?: string } | null)?.code === '23505' && attempt === 0) {
      slug = `${slugify(dto.name)}-${Math.random().toString(36).slice(2, 8)}`
      continue
    }
    throw new Error(error?.message ?? 'No se pudo crear el servicio.')
  }
  if (!serviceId) throw new Error('No se pudo crear el servicio.')

  await insertSubcategories(client, serviceId, dto.subcategoryIds, dto.categoryId)

  revalidateService(slug)
  const detail = await getServiceById(serviceId)
  if (!detail) throw new Error('El servicio se creó pero no se pudo leer de vuelta.')
  return detail
}

export async function updateServiceAction(
  id: string,
  dto: UpdateProfessionalServiceDTO,
): Promise<ProfessionalServiceDetailResponse> {
  const { userId, client } = await requireSession()

  const update = buildServiceUpdatePatch(dto)

  if (Object.keys(update).length > 0) {
    const { error } = await client
      .from('professional_services')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  }

  // Replace subcategories when the caller sends a new set.
  if (dto.subcategoryIds !== undefined) {
    await client.from('professional_service_subcategories').delete().eq('service_id', id)
    await insertSubcategories(client, id, dto.subcategoryIds, dto.categoryId)
  }

  const detail = await getServiceById(id)
  if (!detail) throw new Error('No se pudo leer el servicio actualizado.')
  revalidateService(detail.service.slug)
  return detail
}

export async function deleteServiceAction(id: string): Promise<{ ok: true }> {
  const { userId, client } = await requireSession()
  const { error } = await client.from('professional_services').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
  revalidateService()
  return { ok: true }
}

interface AddServiceMediaInput {
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string
  caption?: string
  order?: number
}

export async function addServiceMediaAction(
  serviceId: string,
  input: AddServiceMediaInput,
): Promise<{ id: string; type: 'image' | 'video'; url: string; caption?: string; order: number }> {
  const { client } = await requireSession()
  const isVideo = input.type === 'video'
  const cfImageId = isVideo ? null : extractCfImageId(input.url)
  const cfStreamUid = isVideo ? extractStreamUid(input.url) : null
  if (isVideo ? !cfStreamUid : !cfImageId) {
    throw new Error('No se pudo determinar el identificador de Cloudflare del archivo.')
  }

  const { data, error } = await client
    .from('professional_service_media')
    .insert({
      service_id: serviceId,
      type: isVideo ? 'VIDEO' : 'IMAGE',
      cf_image_id: cfImageId,
      cf_stream_uid: cfStreamUid,
      caption: input.caption ?? null,
      position: input.order ?? 0,
    })
    .select('id, type, position, caption')
    .maybeSingle()
  if (error || !data) throw new Error(error?.message ?? 'No se pudo agregar el archivo.')

  const row = data as { id: string; type: string; position: number; caption: string | null }
  revalidateService()
  return {
    id: row.id,
    type: isVideo ? 'video' : 'image',
    url: input.url,
    caption: row.caption ?? undefined,
    order: row.position,
  }
}

export async function removeServiceMediaAction(serviceId: string, mediaId: string): Promise<{ ok: true }> {
  const { client } = await requireSession()
  const { error } = await client
    .from('professional_service_media')
    .delete()
    .eq('id', mediaId)
    .eq('service_id', serviceId)
  if (error) throw new Error(error.message)
  revalidateService()
  return { ok: true }
}

export async function reorderServiceMediaAction(
  serviceId: string,
  order: Array<{ mediaId: string; order: number }>,
): Promise<{ ok: true }> {
  const { client } = await requireSession()
  for (const { mediaId, order: position } of order) {
    const { error } = await client
      .from('professional_service_media')
      .update({ position })
      .eq('id', mediaId)
      .eq('service_id', serviceId)
    if (error) throw new Error(error.message)
  }
  revalidateService()
  return { ok: true }
}

export async function updateServiceMediaAction(
  serviceId: string,
  mediaId: string,
  updates: { caption?: string; order?: number },
): Promise<{ ok: true }> {
  const { client } = await requireSession()
  const patch: Record<string, unknown> = {}
  if (updates.caption !== undefined) patch.caption = updates.caption || null
  if (updates.order !== undefined) patch.position = updates.order
  if (Object.keys(patch).length > 0) {
    const { error } = await client
      .from('professional_service_media')
      .update(patch)
      .eq('id', mediaId)
      .eq('service_id', serviceId)
    if (error) throw new Error(error.message)
  }
  revalidateService()
  return { ok: true }
}

export async function setServiceBusinessCardAction(
  serviceId: string,
  cfImageIdOrUrl: string | null,
): Promise<{ ok: true }> {
  const { userId, client } = await requireSession()
  const cfId = cfImageIdOrUrl ? extractCfImageId(cfImageIdOrUrl) : null
  const { error } = await client
    .from('professional_services')
    .update({ business_card_cf_image_id: cfId })
    .eq('id', serviceId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  revalidateService()
  return { ok: true }
}

export async function createServiceReviewAction(
  serviceId: string,
  input: { rating: number; comment?: string },
): Promise<{ ok: true }> {
  const { userId, client } = await requireSession()
  if (input.rating < 1 || input.rating > 5) throw new Error('La calificación debe estar entre 1 y 5.')
  const { error } = await client
    .from('professional_service_reviews')
    .upsert(
      { service_id: serviceId, user_id: userId, rating: input.rating, comment: input.comment ?? null },
      { onConflict: 'service_id,user_id' },
    )
  if (error) throw new Error(error.message)
  revalidateService()
  return { ok: true }
}
