'use server'

import { revalidatePath } from 'next/cache'
import { type ActionResult, requireAdmin } from './_shared'

/** Admin-only server actions for the discovery-category thumbnails shown on
 *  the `/cities` landing page. Keyed by `category`, not by a city. */

export async function upsertDiscoveryThumbnail(input: {
  category: string
  cfImageId: string
}): Promise<ActionResult<{ category: string }>> {
  const { client } = await requireAdmin()
  const category = (input.category ?? '').trim()
  const cfImageId = (input.cfImageId ?? '').trim()
  if (!category) return { ok: false, error: 'category_required' }
  if (!cfImageId) return { ok: false, error: 'image_required' }

  const { error } = await client
    .from('discovery_thumbnails')
    .upsert({ category, cf_image_id: cfImageId }, { onConflict: 'category' })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/ciudades/thumbnails')
  revalidatePath('/cities/[slug]', 'page')
  return { ok: true, data: { category } }
}

export async function deleteDiscoveryThumbnail(
  category: string,
): Promise<ActionResult<{ category: string }>> {
  const { client } = await requireAdmin()
  const clean = (category ?? '').trim()
  if (!clean) return { ok: false, error: 'category_required' }

  const { error } = await client.from('discovery_thumbnails').delete().eq('category', clean)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/ciudades/thumbnails')
  revalidatePath('/cities/[slug]', 'page')
  return { ok: true, data: { category: clean } }
}
