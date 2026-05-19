import 'server-only'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from './cf'

/**
 * Server reads for `city_places` (PDF item 14 — "Sitios de interés").
 *
 * Public surfaces only ever see `status = 'approved'`. The admin reader
 * (in `features/admin/server/cities.server.ts`) is unfiltered so moderators
 * can see pending/rejected submissions too.
 */

export type PlaceStatus = 'pending' | 'approved' | 'rejected'

export interface CityPlaceDetail {
  id: string
  cityId: string
  name: string
  description: string | null
  cfImageId: string | null
  imageUrl: string | undefined
  category: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  status: PlaceStatus
  submitterId: string | null
  createdAt: string
}

type PlaceRow = {
  id: string
  city_id: string
  name: string
  description: string | null
  cf_image_id: string | null
  category: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  status: PlaceStatus
  submitter_id: string | null
  created_at: string
}

const PLACE_SELECT =
  'id, city_id, name, description, cf_image_id, category, latitude, longitude, address, status, submitter_id, created_at'

function toDetail(row: PlaceRow): CityPlaceDetail {
  return {
    id: row.id,
    cityId: row.city_id,
    name: row.name,
    description: row.description,
    cfImageId: row.cf_image_id,
    imageUrl: cfImageUrl(row.cf_image_id),
    category: row.category,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    status: row.status,
    submitterId: row.submitter_id,
    createdAt: row.created_at,
  }
}

export async function fetchApprovedPlaces(
  client: SupabaseClient,
  cityId: string,
  opts: { limit?: number; offset?: number; category?: string } = {},
): Promise<CityPlaceDetail[]> {
  const limit = opts.limit ?? 60
  const offset = opts.offset ?? 0
  let q = client
    .from('city_places')
    .select(PLACE_SELECT)
    .eq('city_id', cityId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + Math.max(limit - 1, 0))
  if (opts.category) q = q.eq('category', opts.category)
  const { data, error } = await q
  if (error) {
    console.error('[fetchApprovedPlaces]', error)
    return []
  }
  return ((data ?? []) as PlaceRow[]).map(toDetail)
}

export async function fetchPlaceById(
  client: SupabaseClient,
  placeId: string,
): Promise<CityPlaceDetail | null> {
  const { data, error } = await client
    .from('city_places')
    .select(PLACE_SELECT)
    .eq('id', placeId)
    .eq('status', 'approved')
    .maybeSingle()
  if (error) {
    console.error('[fetchPlaceById]', error)
    return null
  }
  if (!data) return null
  return toDetail(data as PlaceRow)
}

export const getApprovedPlaces = cache(
  async (cityId: string, opts: { limit?: number; offset?: number; category?: string } = {}) => {
    const client = await getServerClient()
    return fetchApprovedPlaces(client, cityId, opts)
  },
)

export const getPlaceById = cache(async (placeId: string) => {
  const client = await getServerClient()
  return fetchPlaceById(client, placeId)
})
