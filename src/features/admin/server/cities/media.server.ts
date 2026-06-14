import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from '@/features/cities/server/cf'
import { type PaginatedList } from './_shared.server'

/** Per-city media: photos, videos (with Cloudflare Stream thumb/embed URLs),
 *  and publications. */

export interface AdminPhotoRow {
  id: string
  cfImageId: string
  imageUrl?: string
  caption: string | null
  createdAt: string
}

export interface AdminVideoRow {
  id: string
  cfVideoUid: string
  cfThumbnailId: string | null
  thumbnailUrl?: string
  caption: string | null
  createdAt: string
}

export interface AdminPublicationRow {
  id: string
  body: string
  cfMedia: unknown
  isPinned: boolean
  createdAt: string
}

const CF_STREAM_CUSTOMER = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE ?? ''

export function cfStreamThumbUrl(uid: string): string | undefined {
  if (!uid || !CF_STREAM_CUSTOMER) return undefined
  return `https://customer-${CF_STREAM_CUSTOMER}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg`
}

export function cfStreamEmbedUrl(uid: string): string | undefined {
  if (!uid || !CF_STREAM_CUSTOMER) return undefined
  return `https://customer-${CF_STREAM_CUSTOMER}.cloudflarestream.com/${uid}/iframe`
}

export const listCityPhotosForAdmin = cache(async function listCityPhotosForAdmin(
  cityId: string,
  params: { page?: number; pageSize?: number },
): Promise<PaginatedList<AdminPhotoRow>> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(60, Math.max(1, params.pageSize ?? 24))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await client
    .from('city_photos')
    .select('id, cf_image_id, caption, created_at', { count: 'exact' })
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) {
    console.error('[listCityPhotosForAdmin]', error)
    return { items: [], total: 0, page, pageSize }
  }
  type Row = { id: string; cf_image_id: string; caption: string | null; created_at: string }
  const items = ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    cfImageId: r.cf_image_id,
    imageUrl: cfImageUrl(r.cf_image_id),
    caption: r.caption,
    createdAt: r.created_at,
  }))
  return { items, total: count ?? 0, page, pageSize }
})

export const listCityVideosForAdmin = cache(async function listCityVideosForAdmin(
  cityId: string,
  params: { page?: number; pageSize?: number },
): Promise<PaginatedList<AdminVideoRow>> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await client
    .from('city_videos')
    .select('id, cf_video_uid, cf_thumbnail_id, caption, created_at', { count: 'exact' })
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) {
    console.error('[listCityVideosForAdmin]', error)
    return { items: [], total: 0, page, pageSize }
  }
  type Row = {
    id: string
    cf_video_uid: string
    cf_thumbnail_id: string | null
    caption: string | null
    created_at: string
  }
  const items = ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    cfVideoUid: r.cf_video_uid,
    cfThumbnailId: r.cf_thumbnail_id,
    thumbnailUrl: r.cf_thumbnail_id
      ? cfImageUrl(r.cf_thumbnail_id)
      : cfStreamThumbUrl(r.cf_video_uid),
    caption: r.caption,
    createdAt: r.created_at,
  }))
  return { items, total: count ?? 0, page, pageSize }
})

export const listCityPublicationsForAdmin = cache(async function listCityPublicationsForAdmin(
  cityId: string,
  params: { page?: number; pageSize?: number },
): Promise<PaginatedList<AdminPublicationRow>> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await client
    .from('city_publications')
    .select('id, body, cf_media, is_pinned, created_at', { count: 'exact' })
    .eq('city_id', cityId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) {
    console.error('[listCityPublicationsForAdmin]', error)
    return { items: [], total: 0, page, pageSize }
  }
  type Row = {
    id: string
    body: string
    cf_media: unknown
    is_pinned: boolean
    created_at: string
  }
  const items = ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    body: r.body,
    cfMedia: r.cf_media,
    isPinned: r.is_pinned,
    createdAt: r.created_at,
  }))
  return { items, total: count ?? 0, page, pageSize }
})
