import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from '@/features/cities/server/cf'
import { type PaginatedList, fetchProfilesByIds, profileToDisplay } from './_shared.server'

/** Per-city complaints (admin moderation). */

export interface AdminComplaintRow {
  id: string
  title: string
  description: string | null
  category: string | null
  imageUrls: string[]
  status: 'new' | 'seen' | 'resolved' | 'rejected'
  reporterId: string | null
  reporterName: string | null
  createdAt: string
}

export const listCityComplaintsForAdmin = cache(async function listCityComplaintsForAdmin(
  cityId: string,
  params: { status?: 'new' | 'seen' | 'resolved' | 'rejected'; page?: number; pageSize?: number },
): Promise<PaginatedList<AdminComplaintRow>> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20))
  let q = client
    .from('city_complaints')
    .select(
      'id, title, description, category, cf_image_ids, status, reporter_id, created_at',
      { count: 'exact' },
    )
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
  if (params.status) q = q.eq('status', params.status)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await q.range(from, to)
  if (error) {
    console.error('[listCityComplaintsForAdmin]', error)
    return { items: [], total: 0, page, pageSize }
  }
  type Row = {
    id: string
    title: string
    description: string | null
    category: string | null
    cf_image_ids: string[]
    status: AdminComplaintRow['status']
    reporter_id: string | null
    created_at: string
  }
  const rows = (data ?? []) as Row[]
  const profiles = await fetchProfilesByIds(rows.map((r) => r.reporter_id))
  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    imageUrls: (r.cf_image_ids ?? [])
      .map((id) => cfImageUrl(id))
      .filter((url): url is string => Boolean(url)),
    status: r.status,
    reporterId: r.reporter_id,
    reporterName: profileToDisplay(r.reporter_id ? profiles.get(r.reporter_id) : null),
    createdAt: r.created_at,
  }))
  return { items, total: count ?? 0, page, pageSize }
})
