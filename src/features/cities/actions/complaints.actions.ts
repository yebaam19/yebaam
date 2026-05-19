'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

const MAX_TITLE = 200
const MAX_DESCRIPTION = 4000
const MAX_IMAGES = 6

export interface SubmitComplaintInput {
  cityId: string
  title: string
  description?: string
  category?: string
  cfImageIds?: string[]
}

/**
 * Citizen complaint submission. Any authenticated user can file one for any
 * city. RLS is expected to gate the row to `reporter_id = auth.uid()`. The
 * insert lands in status='new'; admins move it to seen/resolved/rejected via
 * the admin action `setCityComplaintStatus`.
 */
export async function submitCityComplaint(
  input: SubmitComplaintInput,
): Promise<ActionResult<{ id: string }>> {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return { ok: false, error: 'unauthenticated' }

  const title = (input.title ?? '').trim()
  if (!title) return { ok: false, error: 'title_required' }
  if (title.length > MAX_TITLE) return { ok: false, error: 'title_too_long' }

  const description = (input.description ?? '').trim()
  if (description.length > MAX_DESCRIPTION) return { ok: false, error: 'description_too_long' }

  const images = (input.cfImageIds ?? []).filter((id) => typeof id === 'string' && id.length > 0)
  if (images.length > MAX_IMAGES) return { ok: false, error: 'too_many_images' }

  const { data, error } = await client
    .from('city_complaints')
    .insert({
      city_id: input.cityId,
      reporter_id: auth.user.id,
      title,
      description: description || null,
      category: input.category?.trim() || null,
      cf_image_ids: images,
      status: 'new',
    })
    .select('id, cities:city_id(slug)')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }
  const row = data as unknown as { id: string; cities: { slug: string } | null }
  if (row.cities?.slug) revalidatePath(`/cities/${row.cities.slug}/complaints`)
  return { ok: true, data: { id: row.id } }
}
