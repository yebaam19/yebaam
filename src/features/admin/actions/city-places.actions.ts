'use server'

import {
  type ActionResult,
  requireAdmin,
  deleteCityRow,
  revalidateCityById,
} from './_shared'

/** Admin-only CRUD for the curated places (points of interest) attached to a
 *  city. Revalidates the city's `/places` sub-page on every change. */

const PLACE_STATUSES = new Set(['pending', 'approved', 'rejected'])

export interface UpsertCityPlaceInput {
  cityId: string
  placeId?: string
  name: string
  description?: string | null
  cfImageId?: string | null
  category?: string | null
  latitude?: number | null
  longitude?: number | null
  address?: string | null
  status?: 'pending' | 'approved' | 'rejected'
}

export async function upsertCityPlace(
  input: UpsertCityPlaceInput,
): Promise<ActionResult<{ id: string }>> {
  const { client } = await requireAdmin()
  if (!input.cityId) return { ok: false, error: 'city_required' }
  const name = (input.name ?? '').trim()
  if (!name) return { ok: false, error: 'name_required' }
  const status = input.status ?? 'approved'
  if (!PLACE_STATUSES.has(status)) return { ok: false, error: 'invalid_status' }

  const payload = {
    city_id: input.cityId,
    name,
    description: (input.description ?? '').trim() || null,
    cf_image_id: input.cfImageId ?? null,
    category: input.category?.trim() || null,
    latitude: typeof input.latitude === 'number' ? input.latitude : null,
    longitude: typeof input.longitude === 'number' ? input.longitude : null,
    address: input.address?.trim() || null,
    status,
  }

  const query = input.placeId
    ? client.from('city_places').update(payload).eq('id', input.placeId)
    : client.from('city_places').insert(payload)
  const { data, error } = await query.select('id, city_id').maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: input.placeId ? 'not_found' : 'insert_returned_no_row' }

  const row = data as { id: string; city_id: string }
  await revalidateCityById(client, row.city_id, ['places'])
  return { ok: true, data: { id: row.id } }
}

export async function deleteCityPlace(input: {
  placeId: string
}): Promise<ActionResult<{ id: string }>> {
  return deleteCityRow({ table: 'city_places', id: input.placeId, section: 'places' })
}
