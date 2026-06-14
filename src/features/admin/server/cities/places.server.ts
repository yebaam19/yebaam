import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from '@/features/cities/server/cf'
import { type PaginatedList } from './_shared.server'

/** Per-city places (admin view — unfiltered by status). */

export interface AdminPlaceRow {
  id: string
  name: string
  description: string | null
  cfImageId: string | null
  imageUrl?: string
  category: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export const listCityPlacesForAdmin = cache(async function listCityPlacesForAdmin(
  cityId: string,
  params: { status?: 'pending' | 'approved' | 'rejected'; page?: number; pageSize?: number },
): Promise<PaginatedList<AdminPlaceRow>> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 50))
  let q = client
    .from('city_places')
    .select(
      'id, name, description, cf_image_id, category, latitude, longitude, address, status, created_at',
      { count: 'exact' },
    )
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
  if (params.status) q = q.eq('status', params.status)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await q.range(from, to)
  if (error) {
    console.error('[listCityPlacesForAdmin]', error)
    return { items: [], total: 0, page, pageSize }
  }
  type Row = {
    id: string
    name: string
    description: string | null
    cf_image_id: string | null
    category: string | null
    latitude: number | null
    longitude: number | null
    address: string | null
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
  }
  const items = ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    cfImageId: r.cf_image_id,
    imageUrl: cfImageUrl(r.cf_image_id),
    category: r.category,
    latitude: r.latitude,
    longitude: r.longitude,
    address: r.address,
    status: r.status,
    createdAt: r.created_at,
  }))
  return { items, total: count ?? 0, page, pageSize }
})
