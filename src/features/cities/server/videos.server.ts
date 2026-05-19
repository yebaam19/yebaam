import 'server-only'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from './cf'

const CF_STREAM_CUSTOMER = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE ?? ''

export function cfStreamThumb(uid: string): string | undefined {
  if (!uid || !CF_STREAM_CUSTOMER) return undefined
  return `https://customer-${CF_STREAM_CUSTOMER}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg`
}

export function cfStreamEmbed(uid: string): string | undefined {
  if (!uid || !CF_STREAM_CUSTOMER) return undefined
  return `https://customer-${CF_STREAM_CUSTOMER}.cloudflarestream.com/${uid}/iframe`
}

export interface CityVideo {
  id: string
  cityId: string
  cfVideoUid: string
  thumbnailUrl: string | undefined
  embedUrl: string | undefined
  caption: string | null
  createdAt: string
}

type Row = {
  id: string
  city_id: string
  cf_video_uid: string
  cf_thumbnail_id: string | null
  caption: string | null
  created_at: string
}

export async function fetchCityVideos(
  client: SupabaseClient,
  cityId: string,
  opts: { limit?: number } = {},
): Promise<CityVideo[]> {
  const limit = opts.limit ?? 50
  const { data, error } = await client
    .from('city_videos')
    .select('id, city_id, cf_video_uid, cf_thumbnail_id, caption, created_at')
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('[fetchCityVideos]', error)
    return []
  }
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    cityId: r.city_id,
    cfVideoUid: r.cf_video_uid,
    thumbnailUrl: r.cf_thumbnail_id ? cfImageUrl(r.cf_thumbnail_id) : cfStreamThumb(r.cf_video_uid),
    embedUrl: cfStreamEmbed(r.cf_video_uid),
    caption: r.caption,
    createdAt: r.created_at,
  }))
}

export const getCityVideos = cache(async (cityId: string, opts: { limit?: number } = {}) => {
  const client = await getServerClient()
  return fetchCityVideos(client, cityId, opts)
})
