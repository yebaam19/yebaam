'use server'

import { ProfessionalServiceDetailResponse } from '../../interfaces/professional-service.interfaces'
import { getMyServiceEligibility, getServiceById } from '../../server/services.server'
import {
  buildServiceInsertPayload,
  buildServiceUpdatePatch,
  slugify,
  type CreateServiceActionInput,
  type ServiceActionResult,
  type UpdateServicePatchInput,
} from '../service-action.helpers'
import {
  insertSubcategories,
  replaceSubcategories,
  requireSession,
  revalidateService,
  uniqueServiceSlug,
} from '../service-action.session'

/**
 * Contrato de errores: estas actions DEVUELVEN los fallos como
 * `{ ok:false, error }` en lugar de lanzarlos — Next.js redacta los mensajes de
 * errores lanzados desde Server Actions en producción. Los helpers internos
 * pueden lanzar; aquí se atrapa todo antes de cruzar al cliente.
 */

function toFailure(err: unknown, fallbackMessage: string): { ok: false; error: string } {
  return {
    ok: false,
    error: err instanceof Error && err.message ? err.message : fallbackMessage,
  }
}

export async function createServiceAction(
  dto: CreateServiceActionInput,
): Promise<ServiceActionResult<ProfessionalServiceDetailResponse>> {
  try {
    const { userId, client } = await requireSession()

    // Art. 12 (Manual de Convivencia): sin la declaración de autonomía del
    // prestador no se publica. Persistir `provider_declaration_accepted_at`
    // queda pendiente de la migración en cola (schema congelado en este pase);
    // por ahora solo se valida.
    if (dto.providerDeclarationAccepted !== true) {
      return {
        ok: false,
        error:
          'Debes aceptar la declaración de autonomía e independencia para publicar un servicio.',
      }
    }

    // PDF eligibility rule: only a verified professional profile may publish.
    const eligibility = await getMyServiceEligibility()
    if (!eligibility.eligible) {
      return {
        ok: false,
        error:
          'Para publicar un servicio necesitas un perfil profesional con al menos un título o estudio verificado por la plataforma.',
      }
    }

    if (!dto.name?.trim()) return { ok: false, error: 'El nombre del servicio es obligatorio.' }

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
      return { ok: false, error: error?.message ?? 'No se pudo crear el servicio.' }
    }
    if (!serviceId) return { ok: false, error: 'No se pudo crear el servicio.' }

    try {
      await insertSubcategories(client, serviceId, dto.subcategoryIds, dto.categoryId)
    } catch (subErr) {
      // Sin subcategorías el servicio quedaría sin categorizar: revertimos el
      // insert (best-effort) y devolvemos el error para que el usuario reintente.
      await client.from('professional_services').delete().eq('id', serviceId).eq('user_id', userId)
      return toFailure(subErr, 'No se pudieron guardar las subcategorías del servicio.')
    }

    revalidateService(slug)
    const detail = await getServiceById(serviceId)
    if (!detail) return { ok: false, error: 'El servicio se creó pero no se pudo leer de vuelta.' }
    return { ok: true, data: detail }
  } catch (err) {
    return toFailure(err, 'No se pudo crear el servicio.')
  }
}

export async function updateServiceAction(
  id: string,
  dto: UpdateServicePatchInput,
): Promise<ServiceActionResult<ProfessionalServiceDetailResponse>> {
  try {
    const { userId, client } = await requireSession()

    const update = buildServiceUpdatePatch(dto)

    if (Object.keys(update).length > 0) {
      const { error } = await client
        .from('professional_services')
        .update(update)
        .eq('id', id)
        .eq('user_id', userId)
      if (error) return { ok: false, error: error.message }
    }

    // Replace subcategories when the caller sends a new set. El reemplazo es
    // por diff (insertar nuevas → borrar sobrantes) para que un fallo no deje
    // el servicio sin categorizar.
    if (dto.subcategoryIds !== undefined) {
      await replaceSubcategories(client, id, dto.subcategoryIds, dto.categoryId)
    }

    const detail = await getServiceById(id)
    if (!detail) return { ok: false, error: 'No se pudo leer el servicio actualizado.' }
    revalidateService(detail.service.slug)
    return { ok: true, data: detail }
  } catch (err) {
    return toFailure(err, 'No se pudo actualizar el servicio.')
  }
}

export async function deleteServiceAction(id: string): Promise<ServiceActionResult<{ id: string }>> {
  try {
    const { userId, client } = await requireSession()
    const { error } = await client
      .from('professional_services')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return { ok: false, error: error.message }
    revalidateService()
    return { ok: true, data: { id } }
  } catch (err) {
    return toFailure(err, 'No se pudo eliminar el servicio.')
  }
}
