import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type {
  AdminBadgeRow,
  AdminUserLookup,
  BadgeAuditRow,
  BadgeRequestRow,
  UserBadgeGrant,
} from '@/features/admin/types/badges.types'
import { aggregateBadgeCounts } from '@/features/admin/server/badges/badge-counts.server'
import {
  BADGE_COLUMNS,
  mapAuditRow,
  mapBadgeRow,
  mapGrantRow,
  mapRequestRow,
  mapUserLookup,
  type BadgeListRow,
} from '@/features/admin/server/badges/badges.mappers'

/**
 * Server reads backing the `/admin/badges/**` views.
 * All exports are `cache()`-wrapped so multiple components on the same page
 * share one DB hit per request. Authorization is enforced by the calling
 * page via `requirePlatformAdmin()`; the RLS policies on `badges`,
 * `user_badges`, `badge_requests`, `badge_audit_log` already grant SELECT to
 * `platform_admins`, so the queries don't carry an extra gate.
 */

// ---------- Badges list ----------

export interface ListAdminBadgesResult {
  items: AdminBadgeRow[]
  total: number
  page: number
  pageSize: number
}

export const listAdminBadges = cache(async function listAdminBadges(params: {
  search?: string
  slot?: 'insignia' | 'badge'
  category?: string
  includeDeleted?: boolean
  page?: number
  pageSize?: number
}): Promise<ListAdminBadgesResult> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25))
  const search = (params.search ?? '').trim()

  let q = client
    .from('badges')
    .select(BADGE_COLUMNS, { count: 'exact' })
    .order('is_system', { ascending: false })
    .order('name', { ascending: true })

  if (!params.includeDeleted) q = q.is('deleted_at', null)
  if (params.slot) q = q.eq('slot', params.slot)
  if (params.category) q = q.eq('category', params.category)
  if (search) {
    const like = `%${search.replace(/[%,]/g, ' ')}%`
    q = q.or(`name.ilike.${like},slug.ilike.${like}`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await q.range(from, to)
  if (error) {
    console.error('[listAdminBadges]', error)
    return { items: [], total: 0, page, pageSize }
  }
  const rows = (data ?? []) as unknown as BadgeListRow[]

  // Aggregate active grant counts + pending request counts per badge.
  const ids = rows.map((r) => r.id)
  const counts = await aggregateBadgeCounts(ids)

  const items: AdminBadgeRow[] = rows.map((r) => mapBadgeRow(r, counts))

  return { items, total: count ?? 0, page, pageSize }
})

// ---------- Single badge detail ----------

export const getAdminBadgeBySlug = cache(async function getAdminBadgeBySlug(
  slug: string,
): Promise<AdminBadgeRow | null> {
  const client = await getServerClient()
  const { data, error } = await client
    .from('badges')
    .select(BADGE_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error('[getAdminBadgeBySlug]', error)
    return null
  }
  if (!data) return null
  const row = data as unknown as BadgeListRow
  const counts = await aggregateBadgeCounts([row.id])
  return mapBadgeRow(row, counts)
})

// ---------- Grants for a badge ----------

export const listBadgeGrants = cache(async function listBadgeGrants(
  badgeId: string,
  opts: { includeRevoked?: boolean } = {},
): Promise<UserBadgeGrant[]> {
  const client = await getServerClient()
  let q = client
    .from('user_badges')
    .select(
      `id, user_id, awarded_by, awarded_at, reason, acceptance_status, accepted_at, declined_at,
       revoked_at, revoke_reason, is_hidden,
       recipient:profiles!user_badges_user_id_fkey(id, username, display_name, first_name, last_name, avatar_url),
       granter:profiles!user_badges_awarded_by_fkey(id, username)`,
    )
    .eq('badge_id', badgeId)
    .order('awarded_at', { ascending: false })
  if (!opts.includeRevoked) q = q.is('revoked_at', null)
  const { data, error } = await q
  if (error) {
    console.error('[listBadgeGrants]', error)
    return []
  }
  return ((data ?? []) as unknown as Parameters<typeof mapGrantRow>[0][]).map(mapGrantRow)
})

// ---------- Audit log ----------

export const listBadgeAudit = cache(async function listBadgeAudit(params: {
  badgeId?: string
  userId?: string
  page?: number
  pageSize?: number
}): Promise<BadgeAuditRow[]> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 50))

  let q = client
    .from('badge_audit_log')
    .select(
      `id, action, badge_id, user_id, actor_id, reason, detail, created_at,
       badge:badges!badge_audit_log_badge_id_fkey(name),
       recipient:profiles!badge_audit_log_user_id_fkey(username),
       actor:profiles!badge_audit_log_actor_id_fkey(username)`,
    )
    .order('created_at', { ascending: false })
  if (params.badgeId) q = q.eq('badge_id', params.badgeId)
  if (params.userId) q = q.eq('user_id', params.userId)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error } = await q.range(from, to)
  if (error) {
    console.error('[listBadgeAudit]', error)
    return []
  }
  return ((data ?? []) as unknown as Parameters<typeof mapAuditRow>[0][]).map(mapAuditRow)
})

// ---------- User lookup for grant ----------

export const lookupUserForGrant = cache(async function lookupUserForGrant(
  query: string,
): Promise<AdminUserLookup[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const client = await getServerClient()
  const like = `%${q.replace(/[%,]/g, ' ')}%`
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q)
  let req = client
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, avatar_url')
    .limit(10)
  req = isUuid
    ? req.eq('id', q)
    : req.or(`username.ilike.${like},display_name.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`)
  const { data, error } = await req
  if (error) {
    console.error('[lookupUserForGrant]', error)
    return []
  }
  return ((data ?? []) as unknown as Parameters<typeof mapUserLookup>[0][]).map(mapUserLookup)
})

// ---------- Badge requests admin queue ----------

export const listPendingBadgeRequests = cache(async function listPendingBadgeRequests(params: {
  status?: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  page?: number
  pageSize?: number
}): Promise<BadgeRequestRow[]> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25))
  const status = params.status ?? 'pending'

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error } = await client
    .from('badge_requests')
    .select(
      `id, status, badge_id, user_id, reason, supporting_cf_image_ids, created_at,
       reviewed_at, reviewed_by, decision_reason,
       badge:badges!badge_requests_badge_id_fkey(slug, name, icon_cf_image_id, evidence_required),
       requester:profiles!badge_requests_user_id_fkey(id, username, display_name, first_name, last_name, avatar_url),
       reviewer:profiles!badge_requests_reviewed_by_fkey(username)`,
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) {
    console.error('[listPendingBadgeRequests]', error)
    return []
  }
  return ((data ?? []) as unknown as Parameters<typeof mapRequestRow>[0][]).map(mapRequestRow)
})
