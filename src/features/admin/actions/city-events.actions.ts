'use server'

import { cityEventSchema, type CityEvent } from '@/features/cities/events/types'
import { getImageProvenance } from '@/lib/cloudflare/images'
import { requireAdminWithUser, revalidateCityById, type ActionResult } from './_shared'

/** Stable ids make retries idempotent; the database enforces city immutability. */
export async function saveCityEvent(input: CityEvent): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!userId) return { ok: false, error: 'No tienes permiso para guardar eventos.' }
  const parsed = cityEventSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' }
  const event = parsed.data
  const { data: previous, error: readError } = await client.from('city_events')
    .select('city_id, cover_cf_image_id').eq('id', event.id).maybeSingle()
  if (readError) return { ok: false, error: 'No se pudo verificar el evento.' }
  if (previous && previous.city_id !== event.city_id) return { ok: false, error: 'El evento pertenece a otra ciudad.' }
  if (event.cover_cf_image_id && previous?.cover_cf_image_id !== event.cover_cf_image_id) {
    try {
      const image = await getImageProvenance(event.cover_cf_image_id)
      if (!image?.ready || image.requiresSignature || image.uploadedBy !== userId || image.source !== 'city-event') {
        return { ok: false, error: 'La imagen no es válida. Vuelve a subirla.' }
      }
    } catch { return { ok: false, error: 'No se pudo verificar la imagen.' } }
  }
  const { error } = await client.from('city_events').upsert(event, { onConflict: 'id' })
  if (error) return { ok: false, error: 'No se pudo guardar el evento. Inténtalo de nuevo.' }
  await revalidateCityById(client, event.city_id, ['events'])
  return { ok: true, data: { id: event.id } }
}
