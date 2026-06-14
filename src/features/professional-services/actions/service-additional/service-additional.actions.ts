'use server'

import { extractCfImageId } from '../service-action.helpers'
import { requireSession, revalidateService } from '../service-action.session'

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
