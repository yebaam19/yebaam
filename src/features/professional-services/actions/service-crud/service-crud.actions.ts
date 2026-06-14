'use server'

import {
  CreateProfessionalServiceDTO,
  ProfessionalServiceDetailResponse,
  UpdateProfessionalServiceDTO,
} from '../../interfaces/professional-service.interfaces'
import { getMyServiceEligibility, getServiceById } from '../../server/services.server'
import {
  buildServiceInsertPayload,
  buildServiceUpdatePatch,
  slugify,
} from '../service-action.helpers'
import {
  insertSubcategories,
  requireSession,
  revalidateService,
  uniqueServiceSlug,
} from '../service-action.session'

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
