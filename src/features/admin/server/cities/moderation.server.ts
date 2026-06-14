import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from '@/features/cities/server/cf'
import { type PaginatedList, fetchProfilesByIds, profileToDisplay } from './_shared.server'

/** Per-city moderation lists: news, classifieds, and contact-inbox messages. */

export interface AdminNewsRow {
  id: string
  title: string
  status: 'pending' | 'approved' | 'rejected'
  coverImageUrl?: string
  authorId: string | null
  authorName: string | null
  sourceName: string | null
  publishedAt: string | null
  createdAt: string
}

export interface AdminClassifiedRow {
  id: string
  title: string
  status: 'open' | 'sold' | 'closed'
  kind: 'offer' | 'want' | 'trade' | 'free'
  priceCents: number | null
  currency: string
  authorId: string | null
  authorName: string | null
  createdAt: string
}

export interface AdminContactMessageRow {
  id: string
  subject: string | null
  body: string
  status: 'new' | 'read' | 'resolved'
  senderId: string | null
  senderName: string | null
  createdAt: string
}

export const listCityNewsForAdmin = cache(async function listCityNewsForAdmin(
  cityId: string,
  params: { status?: 'pending' | 'approved' | 'rejected'; page?: number; pageSize?: number },
): Promise<PaginatedList<AdminNewsRow>> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20))
  let q = client
    .from('city_news')
    .select(
      'id, title, status, cover_cf_image_id, author_id, source_name, published_at, created_at',
      { count: 'exact' },
    )
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
  if (params.status) q = q.eq('status', params.status)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await q.range(from, to)
  if (error) {
    console.error('[listCityNewsForAdmin]', error)
    return { items: [], total: 0, page, pageSize }
  }
  type Row = {
    id: string
    title: string
    status: 'pending' | 'approved' | 'rejected'
    cover_cf_image_id: string | null
    author_id: string | null
    source_name: string | null
    published_at: string | null
    created_at: string
  }
  const rows = (data ?? []) as Row[]
  const profiles = await fetchProfilesByIds(rows.map((r) => r.author_id))
  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    coverImageUrl: cfImageUrl(r.cover_cf_image_id),
    authorId: r.author_id,
    authorName: profileToDisplay(r.author_id ? profiles.get(r.author_id) : null),
    sourceName: r.source_name,
    publishedAt: r.published_at,
    createdAt: r.created_at,
  }))
  return { items, total: count ?? 0, page, pageSize }
})

export const listCityClassifiedsForAdmin = cache(async function listCityClassifiedsForAdmin(
  cityId: string,
  params: { status?: 'open' | 'sold' | 'closed'; page?: number; pageSize?: number },
): Promise<PaginatedList<AdminClassifiedRow>> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20))
  let q = client
    .from('city_classifieds')
    .select(
      'id, title, status, kind, price_cents, currency, author_id, created_at',
      { count: 'exact' },
    )
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
  if (params.status) q = q.eq('status', params.status)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await q.range(from, to)
  if (error) {
    console.error('[listCityClassifiedsForAdmin]', error)
    return { items: [], total: 0, page, pageSize }
  }
  type Row = {
    id: string
    title: string
    status: 'open' | 'sold' | 'closed'
    kind: 'offer' | 'want' | 'trade' | 'free'
    price_cents: number | null
    currency: string
    author_id: string | null
    created_at: string
  }
  const rows = (data ?? []) as Row[]
  const profiles = await fetchProfilesByIds(rows.map((r) => r.author_id))
  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    kind: r.kind,
    priceCents: r.price_cents,
    currency: r.currency,
    authorId: r.author_id,
    authorName: profileToDisplay(r.author_id ? profiles.get(r.author_id) : null),
    createdAt: r.created_at,
  }))
  return { items, total: count ?? 0, page, pageSize }
})

export const listCityContactMessagesForAdmin = cache(async function listCityContactMessagesForAdmin(
  cityId: string,
  params: { status?: 'new' | 'read' | 'resolved'; page?: number; pageSize?: number },
): Promise<PaginatedList<AdminContactMessageRow>> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20))
  let q = client
    .from('city_contact_messages')
    .select('id, subject, body, status, sender_id, created_at', { count: 'exact' })
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
  if (params.status) q = q.eq('status', params.status)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await q.range(from, to)
  if (error) {
    console.error('[listCityContactMessagesForAdmin]', error)
    return { items: [], total: 0, page, pageSize }
  }
  type Row = {
    id: string
    subject: string | null
    body: string
    status: 'new' | 'read' | 'resolved'
    sender_id: string | null
    created_at: string
  }
  const rows = (data ?? []) as Row[]
  const profiles = await fetchProfilesByIds(rows.map((r) => r.sender_id))
  const items = rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    body: r.body,
    status: r.status,
    senderId: r.sender_id,
    senderName: profileToDisplay(r.sender_id ? profiles.get(r.sender_id) : null),
    createdAt: r.created_at,
  }))
  return { items, total: count ?? 0, page, pageSize }
})
