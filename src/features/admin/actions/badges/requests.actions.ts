'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminWithUser } from '../_shared'
import { insertAudit, revalidateBadgeSurfaces } from './badges.helpers'
import type { ActionResult } from '../_shared'

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
