'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import type { BadgeFormInput } from '@/features/admin/types/badges.types'

/**
 * Admin-only Server Actions for `/admin/badges/**`. Every export starts with
 * `await requirePlatformAdmin()` so direct navigation to the action endpoint
 * is gated. RLS on badges/user_badges/badge_requests/badge_audit_log already
 * grants writes to `platform_admins`, so the queries use the caller's session.
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function validateSlug(slug: string): string | null {
  if (!slug) return 'slug_required'
  if (slug.length < 2 || slug.length > 80) return 'slug_length'
  if (!SLUG_RE.test(slug)) return 'slug_format'
  return null
}

function sanitizeForm(input: BadgeFormInput): BadgeFormInput {
  return {
    slug: (input.slug ?? '').trim(),
    name: (input.name ?? '').trim(),
    description: (input.description ?? '').trim(),
    iconCfImageId: input.iconCfImageId?.trim() || null,
    category: (input.category ?? 'other').trim() || 'other',
    slot: input.slot === 'badge' ? 'badge' : 'insignia',
    visibility: input.visibility === 'private' ? 'private' : 'public',
    tier: input.tier?.trim() || null,
    isUnique: Boolean(input.isUnique),
    requestable: Boolean(input.requestable),
    autoAccept: Boolean(input.autoAccept),
    requirementsMd: (input.requirementsMd ?? '').trim(),
  }
}

async function insertAudit(
  client: Awaited<ReturnType<typeof getServerClient>>,
  actorId: string,
  action:
    | 'create'
    | 'update'
    | 'soft_delete'
    | 'restore'
    | 'grant'
    | 'revoke'
    | 'request_approve'
    | 'request_reject',
  ctx: { badgeId?: string | null; userId?: string | null; reason?: string | null; detail?: Record<string, unknown> },
): Promise<void> {
  const { error } = await client.from('badge_audit_log').insert({
    actor_id: actorId,
    action,
    badge_id: ctx.badgeId ?? null,
    user_id: ctx.userId ?? null,
    reason: ctx.reason ?? null,
    detail: ctx.detail ?? null,
  })
  if (error) console.error('[badge_audit_log insert]', error)
}

function revalidateBadgeSurfaces(opts?: { username?: string | null; slug?: string }) {
  // Tag-based invalidation across unstable_cache (catalog.server.ts). The
  // 2-arg revalidateTag in Next 16 wants a CacheLife profile name; 'default'
  // matches what unstable_cache uses out of the box.
  revalidatePath('/admin/badges')
  revalidatePath('/insignias')
  if (opts?.slug) {
    revalidatePath(`/admin/badges/${opts.slug}`)
    revalidatePath(`/insignias/${opts.slug}`)
  }
  if (opts?.username) revalidatePath(`/${opts.username}`)
}

// ---------- Badge catalog CRUD ----------

export async function createBadge(
  input: BadgeFormInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  await requirePlatformAdmin()
  const safe = sanitizeForm(input)
  if (!safe.name) return { ok: false, error: 'name_required' }
  const slug = safe.slug || slugify(safe.name)
  const slugErr = validateSlug(slug)
  if (slugErr) return { ok: false, error: slugErr }

  const client = await getServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  const { data: existing } = await client.from('badges').select('id').eq('slug', slug).maybeSingle()
  if (existing) return { ok: false, error: 'slug_taken' }

  const { data, error } = await client
    .from('badges')
    .insert({
      slug,
      name: safe.name,
      description: safe.description,
      icon_cf_image_id: safe.iconCfImageId,
      category: safe.category,
      slot: safe.slot,
      visibility: safe.visibility,
      tier: safe.tier,
      is_unique: safe.isUnique,
      requestable: safe.requestable,
      auto_accept: safe.autoAccept,
      requirements_md: safe.requirementsMd,
      created_by: user.id,
    })
    .select('id, slug')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }

  await insertAudit(client, user.id, 'create', {
    badgeId: data.id,
    detail: { slug: data.slug, name: safe.name },
  })
  revalidateBadgeSurfaces({ slug: data.slug })
  return { ok: true, data: { id: data.id, slug: data.slug } }
}

export async function updateBadge(
  input: BadgeFormInput & { id: string; previousSlug: string },
): Promise<ActionResult<{ slug: string }>> {
  await requirePlatformAdmin()
  if (!input.id) return { ok: false, error: 'id_required' }
  const safe = sanitizeForm(input)
  if (!safe.name) return { ok: false, error: 'name_required' }
  const slug = safe.slug || input.previousSlug
  const slugErr = validateSlug(slug)
  if (slugErr) return { ok: false, error: slugErr }

  const client = await getServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  if (slug !== input.previousSlug) {
    const { data: clash } = await client
      .from('badges')
      .select('id')
      .eq('slug', slug)
      .neq('id', input.id)
      .maybeSingle()
    if (clash) return { ok: false, error: 'slug_taken' }
  }

  const { error } = await client
    .from('badges')
    .update({
      slug,
      name: safe.name,
      description: safe.description,
      icon_cf_image_id: safe.iconCfImageId,
      category: safe.category,
      slot: safe.slot,
      visibility: safe.visibility,
      tier: safe.tier,
      is_unique: safe.isUnique,
      requestable: safe.requestable,
      auto_accept: safe.autoAccept,
      requirements_md: safe.requirementsMd,
    })
    .eq('id', input.id)
  if (error) return { ok: false, error: error.message }

  await insertAudit(client, user.id, 'update', {
    badgeId: input.id,
    detail: { slug, name: safe.name, previousSlug: input.previousSlug },
  })
  revalidateBadgeSurfaces({ slug })
  if (input.previousSlug && input.previousSlug !== slug) {
    revalidatePath(`/admin/badges/${input.previousSlug}`)
    revalidatePath(`/insignias/${input.previousSlug}`)
  }
  return { ok: true, data: { slug } }
}

export async function softDeleteBadge(badgeId: string): Promise<ActionResult<{ slug: string }>> {
  await requirePlatformAdmin()
  if (!badgeId) return { ok: false, error: 'id_required' }

  const client = await getServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  const { data: existing } = await client
    .from('badges')
    .select('slug, is_system')
    .eq('id', badgeId)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'not_found' }
  if (existing.is_system) return { ok: false, error: 'system_badge_immutable' }

  const { error } = await client
    .from('badges')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', badgeId)
  if (error) return { ok: false, error: error.message }

  await insertAudit(client, user.id, 'soft_delete', { badgeId, detail: { slug: existing.slug } })
  revalidateBadgeSurfaces({ slug: existing.slug })
  return { ok: true, data: { slug: existing.slug } }
}

export async function restoreBadge(badgeId: string): Promise<ActionResult<{ slug: string }>> {
  await requirePlatformAdmin()
  if (!badgeId) return { ok: false, error: 'id_required' }

  const client = await getServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  const { data: existing } = await client
    .from('badges')
    .select('slug')
    .eq('id', badgeId)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'not_found' }

  const { error } = await client.from('badges').update({ deleted_at: null }).eq('id', badgeId)
  if (error) return { ok: false, error: error.message }

  await insertAudit(client, user.id, 'restore', { badgeId, detail: { slug: existing.slug } })
  revalidateBadgeSurfaces({ slug: existing.slug })
  return { ok: true, data: { slug: existing.slug } }
}

// ---------- Grants ----------

export async function grantBadge(input: {
  badgeId: string
  userId: string
  reason?: string | null
}): Promise<ActionResult<{ grantId: string }>> {
  await requirePlatformAdmin()
  if (!input.badgeId || !input.userId) return { ok: false, error: 'missing_args' }

  const client = await getServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  // Confirm badge exists + not soft-deleted.
  const { data: badge } = await client
    .from('badges')
    .select('id, slug, deleted_at')
    .eq('id', input.badgeId)
    .maybeSingle()
  if (!badge) return { ok: false, error: 'badge_not_found' }
  if (badge.deleted_at) return { ok: false, error: 'badge_deleted' }

  const { data: recipient } = await client
    .from('profiles')
    .select('username')
    .eq('id', input.userId)
    .maybeSingle()

  const { data, error } = await client
    .from('user_badges')
    .insert({
      badge_id: input.badgeId,
      user_id: input.userId,
      awarded_by: user.id,
      reason: input.reason?.trim() || null,
    })
    .select('id')
    .maybeSingle()
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'already_granted' }
    return { ok: false, error: error.message }
  }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }

  await insertAudit(client, user.id, 'grant', {
    badgeId: input.badgeId,
    userId: input.userId,
    reason: input.reason ?? null,
    detail: { slug: badge.slug },
  })
  revalidateBadgeSurfaces({ slug: badge.slug, username: recipient?.username ?? null })
  return { ok: true, data: { grantId: data.id } }
}

export async function revokeBadge(input: {
  grantId: string
  reason?: string | null
}): Promise<ActionResult<{ grantId: string }>> {
  await requirePlatformAdmin()
  if (!input.grantId) return { ok: false, error: 'id_required' }

  const client = await getServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  const { data: grant } = await client
    .from('user_badges')
    .select('id, badge_id, user_id, badge:badges!user_badges_badge_id_fkey(slug), recipient:profiles!user_badges_user_id_fkey(username)')
    .eq('id', input.grantId)
    .maybeSingle()
  if (!grant) return { ok: false, error: 'not_found' }

  const { error } = await client
    .from('user_badges')
    .update({
      revoked_by: user.id,
      revoked_at: new Date().toISOString(),
      revoke_reason: input.reason?.trim() || null,
    })
    .eq('id', input.grantId)
  if (error) return { ok: false, error: error.message }

  const slug = (grant as unknown as { badge: { slug: string } | null }).badge?.slug
  const username = (grant as unknown as { recipient: { username: string } | null }).recipient?.username
  await insertAudit(client, user.id, 'revoke', {
    badgeId: grant.badge_id,
    userId: grant.user_id,
    reason: input.reason ?? null,
    detail: { slug },
  })
  revalidateBadgeSurfaces({ slug, username })
  return { ok: true, data: { grantId: input.grantId } }
}

// ---------- Request review ----------

export async function approveBadgeRequest(input: {
  requestId: string
  reason?: string | null
}): Promise<ActionResult<{ grantId: string }>> {
  await requirePlatformAdmin()
  if (!input.requestId) return { ok: false, error: 'id_required' }

  const client = await getServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  const { data: req, error: reqErr } = await client
    .from('badge_requests')
    .select('id, badge_id, user_id, status, badge:badges!badge_requests_badge_id_fkey(slug), requester:profiles!badge_requests_user_id_fkey(username)')
    .eq('id', input.requestId)
    .maybeSingle()
  if (reqErr) return { ok: false, error: reqErr.message }
  if (!req) return { ok: false, error: 'not_found' }
  if (req.status !== 'pending') return { ok: false, error: 'not_pending' }

  // Insert the grant. Request-flow grants are auto-accepted (user already
  // asked for it) — override the trigger's auto_accept logic explicitly.
  const nowIso = new Date().toISOString()
  const { data: grant, error: grantErr } = await client
    .from('user_badges')
    .insert({
      badge_id: req.badge_id,
      user_id: req.user_id,
      awarded_by: user.id,
      acceptance_status: 'accepted',
      accepted_at: nowIso,
      source_request_id: req.id,
    })
    .select('id')
    .maybeSingle()
  if (grantErr) {
    if (grantErr.code === '23505') return { ok: false, error: 'already_granted' }
    return { ok: false, error: grantErr.message }
  }
  if (!grant) return { ok: false, error: 'insert_returned_no_row' }

  const { error: updErr } = await client
    .from('badge_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: nowIso,
      decision_reason: input.reason?.trim() || null,
    })
    .eq('id', input.requestId)
  if (updErr) return { ok: false, error: updErr.message }

  const slug = (req as unknown as { badge: { slug: string } | null }).badge?.slug
  const username = (req as unknown as { requester: { username: string } | null }).requester?.username
  await insertAudit(client, user.id, 'request_approve', {
    badgeId: req.badge_id,
    userId: req.user_id,
    reason: input.reason ?? null,
    detail: { slug, requestId: req.id },
  })
  revalidateBadgeSurfaces({ slug, username })
  revalidatePath('/admin/badges/requests')
  return { ok: true, data: { grantId: grant.id } }
}

export async function rejectBadgeRequest(input: {
  requestId: string
  reason?: string | null
}): Promise<ActionResult<{ requestId: string }>> {
  await requirePlatformAdmin()
  if (!input.requestId) return { ok: false, error: 'id_required' }

  const client = await getServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  const { data: req } = await client
    .from('badge_requests')
    .select('id, badge_id, user_id, status, badge:badges!badge_requests_badge_id_fkey(slug), requester:profiles!badge_requests_user_id_fkey(username)')
    .eq('id', input.requestId)
    .maybeSingle()
  if (!req) return { ok: false, error: 'not_found' }
  if (req.status !== 'pending') return { ok: false, error: 'not_pending' }

  const { error } = await client
    .from('badge_requests')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      decision_reason: input.reason?.trim() || null,
    })
    .eq('id', input.requestId)
  if (error) return { ok: false, error: error.message }

  const slug = (req as unknown as { badge: { slug: string } | null }).badge?.slug
  const username = (req as unknown as { requester: { username: string } | null }).requester?.username
  await insertAudit(client, user.id, 'request_reject', {
    badgeId: req.badge_id,
    userId: req.user_id,
    reason: input.reason ?? null,
    detail: { slug, requestId: req.id },
  })
  revalidateBadgeSurfaces({ slug, username })
  revalidatePath('/admin/badges/requests')
  return { ok: true, data: { requestId: input.requestId } }
}
