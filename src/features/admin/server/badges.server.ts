import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from '@/features/badges/server/cf'
import type {
  AdminBadgeRow,
  AdminUserLookup,
  BadgeAuditRow,
  BadgeRequestRow,
  UserBadgeGrant,
} from '@/features/admin/types/badges.types'

/**
 * Server reads backing the `/admin/badges/**` views.
 * All exports are `cache()`-wrapped so multiple components on the same page
 * share one DB hit per request. Authorization is enforced by the calling
 * page via `requirePlatformAdmin()`; the RLS policies on `badges`,
 * `user_badges`, `badge_requests`, `badge_audit_log` already grant SELECT to
 * `platform_admins`, so the queries don't carry an extra gate.
 */

// ---------- Badges list ----------

type BadgeListRow = {
  id: string
  slug: string
  name: string
  description: string
  icon_cf_image_id: string | null
  category: string
  slot: 'insignia' | 'badge'
  visibility: 'public' | 'private'
  tier: string | null
  is_unique: boolean
  requestable: boolean
  auto_accept: boolean
  is_system: boolean
  deleted_at: string | null
  created_at: string
}

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
    .select(
      'id, slug, name, description, icon_cf_image_id, category, slot, visibility, tier, is_unique, requestable, auto_accept, is_system, deleted_at, created_at',
      { count: 'exact' },
    )
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
  const rows = (data ?? []) as BadgeListRow[]

  // Aggregate active grant counts + pending request counts per badge.
  const ids = rows.map((r) => r.id)
  const counts = await aggregateBadgeCounts(ids)

  const items: AdminBadgeRow[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    iconUrl: cfImageUrl(r.icon_cf_image_id),
    category: r.category,
    slot: r.slot,
    visibility: r.visibility,
    tier: r.tier,
    isUnique: Boolean(r.is_unique),
    requestable: Boolean(r.requestable),
    autoAccept: Boolean(r.auto_accept),
    isSystem: Boolean(r.is_system),
    deletedAt: r.deleted_at,
    grantCount: counts[r.id]?.grants ?? 0,
    pendingRequestCount: counts[r.id]?.requests ?? 0,
    createdAt: r.created_at,
  }))

  return { items, total: count ?? 0, page, pageSize }
})

async function aggregateBadgeCounts(
  badgeIds: string[],
): Promise<Record<string, { grants: number; requests: number }>> {
  const out: Record<string, { grants: number; requests: number }> = {}
  if (badgeIds.length === 0) return out
  for (const id of badgeIds) out[id] = { grants: 0, requests: 0 }

  const client = await getServerClient()
  const [grants, requests] = await Promise.all([
    client.from('user_badges').select('badge_id').in('badge_id', badgeIds).is('revoked_at', null),
    client.from('badge_requests').select('badge_id').in('badge_id', badgeIds).eq('status', 'pending'),
  ])
  for (const row of (grants.data ?? []) as Array<{ badge_id: string }>) {
    if (out[row.badge_id]) out[row.badge_id].grants += 1
  }
  for (const row of (requests.data ?? []) as Array<{ badge_id: string }>) {
    if (out[row.badge_id]) out[row.badge_id].requests += 1
  }
  return out
}

// ---------- Single badge detail ----------

export const getAdminBadgeBySlug = cache(async function getAdminBadgeBySlug(
  slug: string,
): Promise<AdminBadgeRow | null> {
  const client = await getServerClient()
  const { data, error } = await client
    .from('badges')
    .select(
      'id, slug, name, description, icon_cf_image_id, category, slot, visibility, tier, is_unique, requestable, auto_accept, is_system, deleted_at, created_at',
    )
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error('[getAdminBadgeBySlug]', error)
    return null
  }
  if (!data) return null
  const row = data as BadgeListRow
  const counts = await aggregateBadgeCounts([row.id])
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    iconUrl: cfImageUrl(row.icon_cf_image_id),
    category: row.category,
    slot: row.slot,
    visibility: row.visibility,
    tier: row.tier,
    isUnique: Boolean(row.is_unique),
    requestable: Boolean(row.requestable),
    autoAccept: Boolean(row.auto_accept),
    isSystem: Boolean(row.is_system),
    deletedAt: row.deleted_at,
    grantCount: counts[row.id]?.grants ?? 0,
    pendingRequestCount: counts[row.id]?.requests ?? 0,
    createdAt: row.created_at,
  }
})

// ---------- Grants for a badge ----------

type GrantRow = {
  id: string
  user_id: string
  awarded_by: string | null
  awarded_at: string
  reason: string | null
  acceptance_status: 'pending' | 'accepted' | 'declined'
  accepted_at: string | null
  declined_at: string | null
  revoked_at: string | null
  revoke_reason: string | null
  is_hidden: boolean
  recipient: {
    id: string
    username: string | null
    display_name: string | null
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
  granter: { id: string; username: string | null } | null
}

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
  return ((data ?? []) as unknown as GrantRow[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    username: r.recipient?.username ?? null,
    displayName:
      r.recipient?.display_name ??
      ([r.recipient?.first_name, r.recipient?.last_name].filter(Boolean).join(' ') || null),
    avatarUrl: r.recipient?.avatar_url ?? null,
    awardedBy: r.awarded_by,
    awardedByUsername: r.granter?.username ?? null,
    awardedAt: r.awarded_at,
    reason: r.reason,
    acceptanceStatus: r.acceptance_status,
    acceptedAt: r.accepted_at,
    declinedAt: r.declined_at,
    revokedAt: r.revoked_at,
    revokeReason: r.revoke_reason,
    isHidden: Boolean(r.is_hidden),
  }))
})

// ---------- Audit log ----------

type AuditRow = {
  id: string
  action: BadgeAuditRow['action']
  badge_id: string | null
  user_id: string | null
  actor_id: string | null
  reason: string | null
  detail: Record<string, unknown> | null
  created_at: string
  badge: { name: string } | null
  recipient: { username: string | null } | null
  actor: { username: string | null } | null
}

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
  return ((data ?? []) as unknown as AuditRow[]).map((r) => ({
    id: r.id,
    action: r.action,
    badgeId: r.badge_id,
    badgeName: r.badge?.name ?? null,
    userId: r.user_id,
    username: r.recipient?.username ?? null,
    actorId: r.actor_id,
    actorUsername: r.actor?.username ?? null,
    reason: r.reason,
    detail: r.detail,
    createdAt: r.created_at,
  }))
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
  return ((data ?? []) as Array<{
    id: string
    username: string | null
    display_name: string | null
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }>).map((r) => ({
    id: r.id,
    username: r.username ?? '',
    displayName:
      r.display_name ??
      ([r.first_name, r.last_name].filter(Boolean).join(' ') || r.username || ''),
    avatarUrl: r.avatar_url,
  }))
})

// ---------- Badge requests admin queue ----------

type RequestListRow = {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  badge_id: string
  user_id: string
  reason: string
  supporting_cf_image_ids: string[]
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  decision_reason: string | null
  badge: { slug: string; name: string; icon_cf_image_id: string | null } | null
  requester: {
    id: string
    username: string | null
    display_name: string | null
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
  reviewer: { username: string | null } | null
}

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
       badge:badges!badge_requests_badge_id_fkey(slug, name, icon_cf_image_id),
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
  return ((data ?? []) as unknown as RequestListRow[]).map((r) => ({
    id: r.id,
    status: r.status,
    badgeId: r.badge_id,
    badgeSlug: r.badge?.slug ?? '',
    badgeName: r.badge?.name ?? '',
    badgeIconUrl: cfImageUrl(r.badge?.icon_cf_image_id),
    userId: r.user_id,
    username: r.requester?.username ?? null,
    displayName:
      r.requester?.display_name ??
      ([r.requester?.first_name, r.requester?.last_name].filter(Boolean).join(' ') || null),
    avatarUrl: r.requester?.avatar_url ?? null,
    reason: r.reason,
    supportingCfImageIds: r.supporting_cf_image_ids ?? [],
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
    reviewedBy: r.reviewed_by,
    reviewedByUsername: r.reviewer?.username ?? null,
    decisionReason: r.decision_reason,
  }))
})
