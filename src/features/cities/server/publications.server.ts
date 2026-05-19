import 'server-only'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServerClient } from '@/utils/supabase/server'

export interface CityPublication {
  id: string
  cityId: string
  body: string
  cfMedia: unknown
  isPinned: boolean
  authorId: string | null
  createdAt: string
}

type Row = {
  id: string
  city_id: string
  body: string
  cf_media: unknown
  is_pinned: boolean
  author_id: string | null
  created_at: string
}

export async function fetchCityPublications(
  client: SupabaseClient,
  cityId: string,
  opts: { limit?: number } = {},
): Promise<CityPublication[]> {
  const limit = opts.limit ?? 50
  const { data, error } = await client
    .from('city_publications')
    .select('id, city_id, body, cf_media, is_pinned, author_id, created_at')
    .eq('city_id', cityId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('[fetchCityPublications]', error)
    return []
  }
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    cityId: r.city_id,
    body: r.body,
    cfMedia: r.cf_media,
    isPinned: r.is_pinned,
    authorId: r.author_id,
    createdAt: r.created_at,
  }))
}

export const getCityPublications = cache(async (cityId: string, opts: { limit?: number } = {}) => {
  const client = await getServerClient()
  return fetchCityPublications(client, cityId, opts)
})
