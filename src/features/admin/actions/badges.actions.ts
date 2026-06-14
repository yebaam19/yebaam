'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminWithUser } from './_shared'
import { slugify, validateSlug } from './_shared'
import {
  sanitizeForm,
  insertAudit,
  revalidateBadgeSurfaces,
} from './badges/badges.helpers'
import type { BadgeFormInput } from '@/features/admin/types/badges.types'

/**
 * Admin-only Server Actions for `/admin/badges/**`. Every export gates via
 * `requireAdminWithUser()` (which redirects a non-admin before any mutation)
 * and returns the acting user id. RLS on badges/user_badges/badge_requests/
 * badge_audit_log already grants writes to `platform_admins`, so the queries
 * use the caller's session.
 */

export type { ActionResult } from './_shared'
import type { ActionResult } from './_shared'

// ---------- Badge catalog CRUD ----------

export async function createBadge(
  input: BadgeFormInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const { client, userId } = await requireAdminWithUser()
  const safe = sanitizeForm(input)
  if (!safe.name) return { ok: false, error: 'name_required' }
  const slug = safe.slug || slugify(safe.name)
  const slugErr = validateSlug(slug)
  if (slugErr) return { ok: false, error: slugErr }

  if (userId === null) return { ok: false, error: 'not_authenticated' }

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
      created_by: userId,
    })
    .select('id, slug')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }

  await insertAudit(client, userId, 'create', {
    badgeId: data.id,
    detail: { slug: data.slug, name: safe.name },
  })
  revalidateBadgeSurfaces({ slug: data.slug })
  return { ok: true, data: { id: data.id, slug: data.slug } }
}

export async function updateBadge(
  input: BadgeFormInput & { id: string; previousSlug: string },
): Promise<ActionResult<{ slug: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!input.id) return { ok: false, error: 'id_required' }
  const safe = sanitizeForm(input)
  if (!safe.name) return { ok: false, error: 'name_required' }
  const slug = safe.slug || input.previousSlug
  const slugErr = validateSlug(slug)
  if (slugErr) return { ok: false, error: slugErr }

  if (userId === null) return { ok: false, error: 'not_authenticated' }

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

  await insertAudit(client, userId, 'update', {
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
  const { client, userId } = await requireAdminWithUser()
  if (!badgeId) return { ok: false, error: 'id_required' }

  if (userId === null) return { ok: false, error: 'not_authenticated' }

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

  await insertAudit(client, userId, 'soft_delete', { badgeId, detail: { slug: existing.slug } })
  revalidateBadgeSurfaces({ slug: existing.slug })
  return { ok: true, data: { slug: existing.slug } }
}

export async function restoreBadge(badgeId: string): Promise<ActionResult<{ slug: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!badgeId) return { ok: false, error: 'id_required' }

  if (userId === null) return { ok: false, error: 'not_authenticated' }

  const { data: existing } = await client
    .from('badges')
    .select('slug')
    .eq('id', badgeId)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'not_found' }

  const { error } = await client.from('badges').update({ deleted_at: null }).eq('id', badgeId)
  if (error) return { ok: false, error: error.message }

  await insertAudit(client, userId, 'restore', { badgeId, detail: { slug: existing.slug } })
  revalidateBadgeSurfaces({ slug: existing.slug })
  return { ok: true, data: { slug: existing.slug } }
}

// ---------- Grants ----------

export async function grantBadge(input: {
  badgeId: string
  userId: string
  reason?: string | null
}): Promise<ActionResult<{ grantId: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!input.badgeId || !input.userId) return { ok: false, error: 'missing_args' }

  if (userId === null) return { ok: false, error: 'not_authenticated' }

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
      awarded_by: userId,
      reason: input.reason?.trim() || null,
    })
    .select('id')
    .maybeSingle()
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'already_granted' }
    return { ok: false, error: error.message }
  }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }

  await insertAudit(client, userId, 'grant', {
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
  const { client, userId } = await requireAdminWithUser()
  if (!input.grantId) return { ok: false, error: 'id_required' }

  if (userId === null) return { ok: false, error: 'not_authenticated' }

  const { data: grant } = await client
    .from('user_badges')
    .select('id, badge_id, user_id, badge:badges!user_badges_badge_id_fkey(slug), recipient:profiles!user_badges_user_id_fkey(username)')
    .eq('id', input.grantId)
    .maybeSingle()
  if (!grant) return { ok: false, error: 'not_found' }

  const { error } = await client
    .from('user_badges')
    .update({
      revoked_by: userId,
      revoked_at: new Date().toISOString(),
      revoke_reason: input.reason?.trim() || null,
    })
    .eq('id', input.grantId)
  if (error) return { ok: false, error: error.message }

  const slug = (grant as unknown as { badge: { slug: string } | null }).badge?.slug
  const username = (grant as unknown as { recipient: { username: string } | null }).recipient?.username
  await insertAudit(client, userId, 'revoke', {
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
  const { client, userId } = await requireAdminWithUser()
  if (!input.requestId) return { ok: false, error: 'id_required' }

  if (userId === null) return { ok: false, error: 'not_authenticated' }

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
      awarded_by: userId,
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
      reviewed_by: userId,
      reviewed_at: nowIso,
      decision_reason: input.reason?.trim() || null,
    })
    .eq('id', input.requestId)
  if (updErr) return { ok: false, error: updErr.message }

  const slug = (req as unknown as { badge: { slug: string } | null }).badge?.slug
  const username = (req as unknown as { requester: { username: string } | null }).requester?.username
  await insertAudit(client, userId, 'request_approve', {
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
  const { client, userId } = await requireAdminWithUser()
  if (!input.requestId) return { ok: false, error: 'id_required' }

  if (userId === null) return { ok: false, error: 'not_authenticated' }

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
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      decision_reason: input.reason?.trim() || null,
    })
    .eq('id', input.requestId)
  if (error) return { ok: false, error: error.message }

  const slug = (req as unknown as { badge: { slug: string } | null }).badge?.slug
  const username = (req as unknown as { requester: { username: string } | null }).requester?.username
  await insertAudit(client, userId, 'request_reject', {
    badgeId: req.badge_id,
    userId: req.user_id,
    reason: input.reason ?? null,
    detail: { slug, requestId: req.id },
  })
  revalidateBadgeSurfaces({ slug, username })
  revalidatePath('/admin/badges/requests')
  return { ok: true, data: { requestId: input.requestId } }
}
