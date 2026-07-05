'use server'

import { extractCfImageId } from '../service-action.helpers'
import { requireSession, revalidateService } from '../service-action.session'

/**
 * Resultado de las Server Actions de este módulo. Los fallos esperados viajan
 * como valor de retorno (Next.js redacta los mensajes de errores lanzados
 * dentro de Server Actions en producción); el cliente decide cómo mostrarlos.
 */
export type ServiceActionResult = { ok: true } | { ok: false; error: string }

function toActionError(scope: string, err: unknown, fallback: string): { ok: false; error: string } {
  console.error(`[professional-services] ${scope} failed:`, err)
  return { ok: false, error: err instanceof Error && err.message ? err.message : fallback }
}

export async function setServiceBusinessCardAction(
  serviceId: string,
  cfImageIdOrUrl: string | null,
): Promise<ServiceActionResult> {
  try {
    const { userId, client } = await requireSession()
    const cfId = cfImageIdOrUrl ? extractCfImageId(cfImageIdOrUrl) : null
    const { error } = await client
      .from('professional_services')
      .update({ business_card_cf_image_id: cfId })
      .eq('id', serviceId)
      .eq('user_id', userId)
    if (error) {
      console.error('[professional-services] setServiceBusinessCardAction update failed:', error.message)
      return { ok: false, error: 'No se pudo guardar la tarjeta de presentación. Intenta de nuevo.' }
    }
    revalidateService()
    return { ok: true }
  } catch (err) {
    return toActionError(
      'setServiceBusinessCardAction',
      err,
      'No se pudo guardar la tarjeta de presentación. Intenta de nuevo.',
    )
  }
}

export async function createServiceReviewAction(
  serviceId: string,
  input: { rating: number; comment?: string },
): Promise<ServiceActionResult> {
  try {
    const { userId, client } = await requireSession()

    const rating = Math.round(input.rating)
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return { ok: false, error: 'La calificación debe estar entre 1 y 5.' }
    }

    // Guard servidor: el dueño no puede reseñar su propio servicio.
    const { data: svc } = await client
      .from('professional_services')
      .select('user_id, slug')
      .eq('id', serviceId)
      .maybeSingle()
    if (!svc) return { ok: false, error: 'El servicio no existe o ya no está disponible.' }
    if (svc.user_id === userId) return { ok: false, error: 'No puedes reseñar tu propio servicio.' }

    const { error } = await client
      .from('professional_service_reviews')
      .upsert(
        { service_id: serviceId, user_id: userId, rating, comment: input.comment?.trim() || null },
        { onConflict: 'service_id,user_id' },
      )
    if (error) {
      console.error('[professional-services] createServiceReviewAction upsert failed:', error.message)
      return { ok: false, error: 'No se pudo guardar la reseña. Intenta de nuevo.' }
    }
    revalidateService(svc.slug)
    return { ok: true }
  } catch (err) {
    return toActionError('createServiceReviewAction', err, 'No se pudo guardar la reseña. Intenta de nuevo.')
  }
}
