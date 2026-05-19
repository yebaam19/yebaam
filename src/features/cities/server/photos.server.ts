import 'server-only'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from './cf'

export interface CityPhoto {
  id: string
  cityId: string
  cfImageId: string
  imageUrl: string | undefined
  caption: string | null
  uploaderId: string | null
  createdAt: string
}

type Row = {
  id: string
  city_id: string
  cf_image_id: string
  caption: string | null
  uploader_id: string | null
  created_at: string
}

const SELECT = 'id, city_id, cf_image_id, caption, uploader_id, created_at'

function toDto(r: Row): CityPhoto {
  return {
    id: r.id,
    cityId: r.city_id,
    cfImageId: r.cf_image_id,
    imageUrl: cfImageUrl(r.cf_image_id),
    caption: r.caption,
    uploaderId: r.uploader_id,
    createdAt: r.created_at,
  }
}

export async function fetchCityPhotos(
  client: SupabaseClient,
  cityId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<CityPhoto[]> {
  const limit = opts.limit ?? 60
  const offset = opts.offset ?? 0
  const { data, error } = await client
    .from('city_photos')
    .select(SELECT)
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
    .range(offset, offset + Math.max(limit - 1, 0))
  if (error) {
    console.error('[fetchCityPhotos]', error)
    return []
  }
  return ((data ?? []) as Row[]).map(toDto)
}

export const getCityPhotos = cache(async (cityId: string, opts: { limit?: number } = {}) => {
  const client = await getServerClient()
  return fetchCityPhotos(client, cityId, opts)
})
