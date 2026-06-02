'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'

import { getServerClient } from '@/utils/supabase/server'
import { findSubcategoryById } from '../data/service-categories-taxonomy'
import { professionalServicePath } from '../constants/routes'
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

// ============================================================================
// SESSION + HELPERS
// ============================================================================

async function requireSession(): Promise<{ userId: string; client: SupabaseClient }> {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('Inicia sesión para continuar.')
  return { userId: data.user.id, client }
}

function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 100) || 'servicio'
  )
}

async function uniqueServiceSlug(client: SupabaseClient, name: string): Promise<string> {
  const base = slugify(name)
  let candidate = base
  for (let i = 0; i < 25; i++) {
    const { data } = await client.from('professional_services').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${i + 2}`
  }
  return `${base}-${Math.random().toString(36).slice(2, 8)}`
}

/** Pull the Cloudflare Images id out of a delivery URL (or pass through a bare id). */
function extractCfImageId(value?: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('http') && !value.includes('/')) return value
  const m = value.match(/imagedelivery\.net\/[^/]+\/([^/?#]+)/)
  return m ? m[1] : null
}

/** Pull the Cloudflare Stream uid out of any of its URL shapes (or pass through a bare uid). */
function extractStreamUid(value?: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('http') && !value.includes('/')) return value
  const m = value.match(/(?:iframe\.videodelivery\.net|videodelivery\.net|cloudflarestream\.com)\/([^/?#]+)/)
  return m ? m[1] : null
}

function revalidateService(slug?: string) {
  revalidatePath('/professional-services')
  if (slug) revalidatePath(professionalServicePath(slug))
}

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

  // Everything except `slug` — the slug is supplied per insert attempt so we can
  // recover from a unique-violation (RLS hides other users' non-public rows, so a
  // pre-check can't see every collision; also closes the check-then-insert race).
  const payload = {
    user_id: userId,
    professional_profile_id: eligibility.professionalProfileId,
    name: dto.name.trim(),
    description: dto.description ?? null,
    category_id: dto.categoryId ?? null,
    city_id: dto.cityId ?? null,
    address: dto.address ?? null,
    email: dto.email ?? null,
    phone: dto.phone ?? null,
    website: dto.website ?? null,
    facebook_url: dto.facebookUrl ?? null,
    instagram_url: dto.instagramUrl ?? null,
    twitter_url: dto.twitterUrl ?? null,
    linkedin_url: dto.linkedinUrl ?? null,
    tiktok_url: dto.tiktokUrl ?? null,
    youtube_url: dto.youtubeUrl ?? null,
    hourly_rate: dto.hourlyRate ?? null,
    daily_rate: dto.dailyRate ?? null,
    project_rate: dto.projectRate ?? null,
    currency: dto.currency ?? 'COP',
    available_for_hire: dto.availableForHire ?? true,
    work_type: dto.workType ?? [],
    // Tags are lowercased so the case-insensitive tag search (cs operator) matches.
    tags: (dto.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
    visibility: dto.visibility ?? 'PUBLIC',
    status: 'ACTIVE',
  }

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

async function insertSubcategories(
  client: SupabaseClient,
  serviceId: string,
  subcategoryIds: string[] | undefined,
  categoryId: string | undefined,
): Promise<void> {
  const ids = (subcategoryIds ?? []).filter(Boolean)
  if (ids.length === 0) return
  const rows = ids.map((subId) => {
    const sub = findSubcategoryById(subId)
    return {
      service_id: serviceId,
      subcategory_id: subId,
      subcategory_name: sub?.name ?? subId,
      category_id: sub?.parentId ?? categoryId ?? null,
    }
  })
  await client.from('professional_service_subcategories').insert(rows)
}

export async function updateServiceAction(
  id: string,
  dto: UpdateProfessionalServiceDTO,
): Promise<ProfessionalServiceDetailResponse> {
  const { userId, client } = await requireSession()

  const update: Record<string, unknown> = {}
  const set = (key: string, value: unknown) => {
    if (value !== undefined) update[key] = value
  }
  set('name', dto.name)
  set('description', dto.description ?? null)
  set('category_id', dto.categoryId)
  set('city_id', dto.cityId)
  set('address', dto.address ?? null)
  set('email', dto.email ?? null)
  set('phone', dto.phone ?? null)
  set('website', dto.website ?? null)
  set('facebook_url', dto.facebookUrl ?? null)
  set('instagram_url', dto.instagramUrl ?? null)
  set('twitter_url', dto.twitterUrl ?? null)
  set('linkedin_url', dto.linkedinUrl ?? null)
  set('tiktok_url', dto.tiktokUrl ?? null)
  set('youtube_url', dto.youtubeUrl ?? null)
  set('hourly_rate', dto.hourlyRate ?? null)
  set('daily_rate', dto.dailyRate ?? null)
  set('project_rate', dto.projectRate ?? null)
  set('currency', dto.currency)
  set('available_for_hire', dto.availableForHire)
  set('work_type', dto.workType)
  set('visibility', dto.visibility)
  if (dto.tags !== undefined) update.tags = (dto.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean)
  if (dto.logoUrl !== undefined) update.logo_cf_image_id = extractCfImageId(dto.logoUrl)
  if (dto.coverUrl !== undefined) update.cover_cf_image_id = extractCfImageId(dto.coverUrl)
  if (dto.adImageUrl !== undefined) update.ad_cf_image_id = extractCfImageId(dto.adImageUrl)
  if (dto.cvUrl !== undefined) update.cv_cf_file_id = extractCfImageId(dto.cvUrl)

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
