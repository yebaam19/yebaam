'use server'

import { getImageProvenance } from '@/lib/cloudflare/images'
import { isUuid } from '@/features/cities/directory/types'
import {
  validAdminEmprendimiento,
  type AdminEmprendimientoInput,
} from '@/features/admin/lib/city-emprendimiento-input'
import { requireAdminWithUser, revalidateCityById, type ActionResult } from './_shared'

const EDIT_COLUMNS = 'id, city_id, name, short_description, story, category, zone, address, phone, whatsapp, hero_cf_image_id, owner_cf_image_id'

export async function loadCityEmprendimientoEditor(
  cityId: string, id: string,
): Promise<ActionResult<AdminEmprendimientoInput>> {
  const { client, userId } = await requireAdminWithUser()
  if (!userId) return { ok: false, error: 'unauthorized' }
  if (!isUuid(cityId) || !isUuid(id)) return { ok: false, error: 'invalid_input' }
  const { data, error } = await client.from('city_emprendimientos')
    .select(EDIT_COLUMNS).eq('city_id', cityId).eq('id', id).maybeSingle()
  if (error || !data) return { ok: false, error: 'not_found' }
  return { ok: true, data: {
    ...data, story: data.story ?? '', zone: data.zone ?? '', address: data.address ?? '',
    phone: data.phone ?? '', whatsapp: data.whatsapp ?? '',
  } as AdminEmprendimientoInput }
}

/** One row per save; gallery, owner, verification and moderation fields are preserved. */
export async function saveCityEmprendimiento(
  input: AdminEmprendimientoInput,
): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!userId) return { ok: false, error: 'unauthorized' }
  if (!validAdminEmprendimiento(input)) return { ok: false, error: 'invalid_input' }
  const { data: previous, error: readError } = await client.from('city_emprendimientos')
    .select('id, city_id, hero_cf_image_id, owner_cf_image_id').eq('id', input.id).maybeSingle()
  if (readError) return { ok: false, error: 'save_failed' }
  if (previous && previous.city_id !== input.city_id) return { ok: false, error: 'invalid_city' }
  for (const field of ['hero_cf_image_id', 'owner_cf_image_id'] as const) {
    const id = input[field]
    if (!id || previous?.[field] === id) continue
    try {
      const image = await getImageProvenance(id)
      if (!image?.ready || image.requiresSignature || image.uploadedBy !== userId || image.source !== 'city-emprendimiento') {
        return { ok: false, error: 'invalid_image' }
      }
    } catch { return { ok: false, error: 'image_unavailable' } }
  }
  // Explicit whitelist: a forged client payload cannot change owner/status/city.
  const fields = {
    name: input.name.trim(), short_description: input.short_description.trim(),
    story: input.story.trim() || null, category: input.category, zone: input.zone.trim() || null,
    address: input.address.trim() || null, phone: input.phone.trim() || null,
    whatsapp: input.whatsapp.trim() || null, hero_cf_image_id: input.hero_cf_image_id,
    owner_cf_image_id: input.owner_cf_image_id,
  }
  const query = previous
    ? client.from('city_emprendimientos').update(fields).eq('id', input.id).eq('city_id', input.city_id)
    : client.from('city_emprendimientos').insert({
      ...fields, id: input.id, city_id: input.city_id, owner_id: userId,
    })
  const { data, error } = await query.select('id').maybeSingle()
  if (error || !data) return { ok: false, error: 'save_failed' }
  await revalidateCityById(client, input.city_id, ['emprendimientos', `emprendimientos/${input.id}`])
  return { ok: true, data: { id: data.id } }
}
