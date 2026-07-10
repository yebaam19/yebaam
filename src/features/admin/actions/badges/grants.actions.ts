'use server'

import { revalidatePath } from 'next/cache'
import { getServiceClient } from '@/utils/supabase/server'
import { requireAdminWithUser } from '../_shared'
import { insertAudit, revalidateBadgeSurfaces } from './badges.helpers'
import type { ActionResult } from '../_shared'

// ---------- Grants ----------

/** Revalidate the admin list + the page's public profile after a page-badge
 *  grant/revoke (the public strip reads active grants for that page). */
function revalidatePageBadgeSurfaces(pageSlug: string): void {
  revalidatePath('/admin/paginas')
  revalidatePath(`/paginas/${pageSlug}`)
}

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

/**
 * Grant a catalog badge to a Página (PDF §2). `page_badge_grants` only has a
 * SELECT RLS policy — writes are reserved to the service role — so after the
 * admin gate the mutation runs on the service client, not the session client.
 */
export async function grantPageBadge(input: {
  badgeId: string
  pageId: string
  reason?: string | null
}): Promise<ActionResult<{ grantId: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!input.badgeId || !input.pageId) return { ok: false, error: 'missing_args' }
  if (userId === null) return { ok: false, error: 'not_authenticated' }

  const { data: badge } = await client
    .from('badges')
    .select('id, slug, deleted_at')
    .eq('id', input.badgeId)
    .maybeSingle()
  if (!badge) return { ok: false, error: 'badge_not_found' }
  if (badge.deleted_at) return { ok: false, error: 'badge_deleted' }

  const { data: page } = await client
    .from('pages')
    .select('id, slug, name')
    .eq('id', input.pageId)
    .maybeSingle()
  if (!page) return { ok: false, error: 'page_not_found' }

  const service = getServiceClient()

  // unique (page_id, badge_id) is NOT partial on revoked_at, so re-granting a
  // revoked badge must reactivate the existing row instead of inserting. Only
  // the service client can see revoked rows (the SELECT policy hides them).
  const { data: existing } = await service
    .from('page_badge_grants')
    .select('id, revoked_at')
    .eq('page_id', input.pageId)
    .eq('badge_id', input.badgeId)
    .maybeSingle()
  if (existing && !existing.revoked_at) return { ok: false, error: 'already_granted' }

  const stamp = {
    awarded_by: userId,
    reason: input.reason?.trim() || null,
    awarded_at: new Date().toISOString(),
    revoked_at: null,
  }
  const { data, error } = existing
    ? await service
        .from('page_badge_grants')
        .update(stamp)
        .eq('id', existing.id)
        .select('id')
        .maybeSingle()
    : await service
        .from('page_badge_grants')
        .insert({ badge_id: input.badgeId, page_id: input.pageId, ...stamp })
        .select('id')
        .maybeSingle()
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'already_granted' }
    return { ok: false, error: error.message }
  }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }

  await insertAudit(client, userId, 'grant', {
    badgeId: input.badgeId,
    userId: null,
    reason: input.reason ?? null,
    detail: { slug: badge.slug, pageId: page.id, pageSlug: page.slug },
  })
  revalidatePageBadgeSurfaces(page.slug)
  return { ok: true, data: { grantId: data.id } }
}

/**
 * Revoke a page badge grant (soft: stamps `revoked_at`). Same RLS story as
 * {@link grantPageBadge} — the UPDATE must run on the service client, and we
 * verify a row was actually stamped instead of trusting a filtered no-op.
 */
export async function revokePageBadge(input: {
  grantId: string
  reason?: string | null
}): Promise<ActionResult<{ grantId: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!input.grantId) return { ok: false, error: 'id_required' }
  if (userId === null) return { ok: false, error: 'not_authenticated' }

  const service = getServiceClient()
  const { data: grant } = await service
    .from('page_badge_grants')
    .select('id, badge_id, page_id, revoked_at, page:pages!page_badge_grants_page_id_fkey(slug)')
    .eq('id', input.grantId)
    .maybeSingle()
  if (!grant) return { ok: false, error: 'not_found' }
  if (grant.revoked_at) return { ok: false, error: 'already_revoked' }

  const { data: revoked, error } = await service
    .from('page_badge_grants')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', input.grantId)
    .is('revoked_at', null)
    .select('id')
  if (error) return { ok: false, error: error.message }
  if (!revoked || revoked.length === 0) return { ok: false, error: 'revoke_no_rows' }

  await insertAudit(client, userId, 'revoke', {
    badgeId: grant.badge_id,
    userId: null,
    reason: input.reason ?? null,
    detail: { pageId: grant.page_id, pageGrantId: grant.id },
  })
  const pageSlug = (grant as unknown as { page: { slug: string } | null }).page?.slug
  if (pageSlug) revalidatePageBadgeSurfaces(pageSlug)
  else revalidatePath('/admin/paginas')
  return { ok: true, data: { grantId: input.grantId } }
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
