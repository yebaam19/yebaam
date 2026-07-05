'use server'

import { requireAdminWithUser } from '../_shared'
import { insertAudit, revalidateBadgeSurfaces } from './badges.helpers'
import type { ActionResult } from '../_shared'

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
    .select('id, slug, deleted_at, evidence_required')
    .eq('id', input.badgeId)
    .maybeSingle()
  if (!badge) return { ok: false, error: 'badge_not_found' }
  if (badge.deleted_at) return { ok: false, error: 'badge_deleted' }

  // Direct grants of evidence-required badges must record how the credential
  // was verified — same policy as approving a document-less request.
  if (badge.evidence_required && !input.reason?.trim()) {
    return { ok: false, error: 'reason_required_evidence_badge' }
  }

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
    detail: {
      slug: badge.slug,
      ...(badge.evidence_required ? { evidenceRequiredBadge: true } : {}),
    },
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
