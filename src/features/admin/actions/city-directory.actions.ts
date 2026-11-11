'use server'

import { getImageProvenance } from '@/lib/cloudflare/images'
import { validDirectoryInput, type DirectoryInput } from '@/features/cities/directory/types'
import { requireAdminWithUser, revalidateCityById, type ActionResult } from './_shared'

/** Stable client-generated ids make a retried save update the same entry. */
export async function saveCityDirectoryEntry(input: DirectoryInput): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!userId) return { ok: false, error: 'unauthorized' }
  if (!validDirectoryInput(input)) return { ok: false, error: 'invalid_input' }
  const { data: category, error: categoryError } = await client.from('business_categories')
    .select('id').eq('slug', input.category).maybeSingle()
  if (categoryError || !category) return { ok: false, error: 'invalid_category' }
  const { data: previous, error: readError } = await client.from('city_directory_entries')
    .select('city_id, category_id, cover_cf_image_id').eq('id', input.id).maybeSingle()
  if (readError) return { ok: false, error: 'save_failed' }
  if (previous && (previous.city_id !== input.city_id || previous.category_id !== category.id)) {
    return { ok: false, error: 'invalid_input' }
  }
  if (input.cover_cf_image_id && previous?.cover_cf_image_id !== input.cover_cf_image_id) {
    try {
      const image = await getImageProvenance(input.cover_cf_image_id)
      if (!image?.ready || image.requiresSignature || image.uploadedBy !== userId || image.source !== 'city-directory') {
        return { ok: false, error: 'invalid_image' }
      }
    } catch { return { ok: false, error: 'image_unavailable' } }
  }
  const { error } = await client.from('city_directory_entries').upsert({
    id: input.id, city_id: input.city_id, category_id: category.id, name: input.name.trim(),
    description: input.description, address: input.address, phone: input.phone,
    website: input.website, cover_cf_image_id: input.cover_cf_image_id, status: input.status,
  }, { onConflict: 'id' })
  if (error) return { ok: false, error: 'save_failed' }
  await revalidateCityById(client, input.city_id, [`directory/${input.category}`])
  return { ok: true, data: { id: input.id } }
}
