import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from '@/features/cities/server/cf'
import { type PaginatedList } from './_shared.server'

/** Per-city promotions (admin moderation list). */

export interface AdminPromotionRow {
  id: string
  title: string
  body: string | null
  coverImageUrl?: string
  duration: '1d' | '2d' | '3d' | '1w' | '2w' | '1m'
  startsAt: string
  expiresAt: string
  status: 'active' | 'expired' | 'removed'
  createdAt: string
}

export const listCityPromotionsForAdmin = cache(async function listCityPromotionsForAdmin(
  cityId: string,
  params: { status?: 'active' | 'expired' | 'removed'; page?: number; pageSize?: number },
): Promise<PaginatedList<AdminPromotionRow>> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20))
  let q = client
    .from('city_promotions')
    .select(
      'id, title, body, cover_cf_image_id, duration, starts_at, expires_at, status, created_at',
      { count: 'exact' },
    )
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
  if (params.status) q = q.eq('status', params.status)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await q.range(from, to)
  if (error) {
    console.error('[listCityPromotionsForAdmin]', error)
    return { items: [], total: 0, page, pageSize }
  }
  type Row = {
    id: string
    title: string
    body: string | null
    cover_cf_image_id: string | null
    duration: AdminPromotionRow['duration']
    starts_at: string
    expires_at: string
    status: AdminPromotionRow['status']
    created_at: string
  }
  const items = ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    coverImageUrl: cfImageUrl(r.cover_cf_image_id),
    duration: r.duration,
    startsAt: r.starts_at,
    expiresAt: r.expires_at,
    status: r.status,
    createdAt: r.created_at,
  }))
  return { items, total: count ?? 0, page, pageSize }
})
