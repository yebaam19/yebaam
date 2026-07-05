'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { isAtLeast18 } from '@/lib/age'

/**
 * User-facing Server Actions for the badge request + acceptance flow.
 * No admin gate — RLS scopes every mutation to `auth.uid()`.
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

const MAX_SUPPORTING_IMAGES = 5
const MAX_REASON_LENGTH = 2000

function revalidateAfterRequestMutation(opts: { slug?: string | null; username?: string | null }) {
  revalidatePath('/insignias')
  if (opts.slug) revalidatePath(`/insignias/${opts.slug}`)
  if (opts.username) revalidatePath(`/${opts.username}`)
  revalidatePath('/admin/badges/requests')
}

// ---------- Request flow ----------

export async function requestBadge(input: {
  badgeSlug: string
  reason: string
  supportingCfImageIds: string[]
}): Promise<ActionResult<{ requestId: string }>> {
  const client = await getServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  const slug = (input.badgeSlug ?? '').trim()
  if (!slug) return { ok: false, error: 'slug_required' }
  const reason = (input.reason ?? '').trim().slice(0, MAX_REASON_LENGTH)
  const supporting = (input.supportingCfImageIds ?? [])
    .filter((id) => typeof id === 'string' && id.trim().length > 0)
    .slice(0, MAX_SUPPORTING_IMAGES)

  const { data: badge } = await client
    .from('badges')
    .select('id, slug, requestable, evidence_required, deleted_at, visibility')
    .eq('slug', slug)
    .maybeSingle()
  if (!badge) return { ok: false, error: 'badge_not_found' }
  if (badge.deleted_at) return { ok: false, error: 'badge_deleted' }
  if (badge.visibility !== 'public') return { ok: false, error: 'badge_not_public' }
  if (!badge.requestable) return { ok: false, error: 'not_requestable' }
  if (badge.evidence_required && supporting.length === 0) {
    return { ok: false, error: 'evidence_required' }
  }
  // Contrato cl.9: minors need verifiable parental consent before a platform
  // can compel document upload (ID/diploma). That consent flow doesn't exist
  // yet, so the safe default is to block credential-badge requests for anyone
  // not provably 18+ rather than collect a minor's documents unsupervised.
  if (badge.evidence_required) {
    const { data: requester } = await client
      .from('profiles')
      .select('birth_date')
      .eq('id', user.id)
      .maybeSingle()
    if (!isAtLeast18(requester?.birth_date ?? null)) {
      return { ok: false, error: 'evidence_requires_adult' }
    }
  }

  // Block duplicate pending requests + existing accepted grants.
  const [{ data: existingRequest }, { data: existingGrant }] = await Promise.all([
    client
      .from('badge_requests')
      .select('id')
      .eq('badge_id', badge.id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle(),
    client
      .from('user_badges')
      .select('id')
      .eq('badge_id', badge.id)
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .maybeSingle(),
  ])
  if (existingRequest) return { ok: false, error: 'request_already_pending' }
  if (existingGrant) return { ok: false, error: 'already_granted' }

  const { data, error } = await client
    .from('badge_requests')
    .insert({
      badge_id: badge.id,
      user_id: user.id,
      status: 'pending',
      reason,
      supporting_cf_image_ids: supporting,
    })
    .select('id')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }

  const { data: profile } = await client
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()
  revalidateAfterRequestMutation({ slug: badge.slug, username: profile?.username ?? null })
  return { ok: true, data: { requestId: data.id } }
}

export async function withdrawBadgeRequest(
  requestId: string,
): Promise<ActionResult<{ requestId: string }>> {
  const client = await getServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }
  if (!requestId) return { ok: false, error: 'id_required' }

  // RLS already restricts UPDATE to own pending rows; the eq() is defense in depth.
  const { error } = await client
    .from('badge_requests')
    .update({ status: 'withdrawn' })
    .eq('id', requestId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
  if (error) return { ok: false, error: error.message }

  revalidateAfterRequestMutation({ slug: null, username: null })
  return { ok: true, data: { requestId } }
}

// ---------- Grant acceptance flow (for admin-direct grants) ----------

async function setAcceptance(
  grantId: string,
  status: 'accepted' | 'declined',
): Promise<ActionResult<{ grantId: string }>> {
  if (!grantId) return { ok: false, error: 'id_required' }
  const client = await getServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  const nowIso = new Date().toISOString()
  const patch =
    status === 'accepted'
      ? { acceptance_status: 'accepted' as const, accepted_at: nowIso }
      : { acceptance_status: 'declined' as const, declined_at: nowIso }

  const { data, error } = await client
    .from('user_badges')
    .update(patch)
    .eq('id', grantId)
    .eq('user_id', user.id)
    .select('id, badge:badges!user_badges_badge_id_fkey(slug)')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found_or_not_owner' }

  const slug = (data as unknown as { badge: { slug: string } | null }).badge?.slug ?? null
  const { data: profile } = await client
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()
  revalidatePath('/configuracion/insignias')
  if (profile?.username) revalidatePath(`/${profile.username}`)
  if (slug) revalidatePath(`/insignias/${slug}`)
  return { ok: true, data: { grantId } }
}

export async function acceptBadge(grantId: string) {
  return setAcceptance(grantId, 'accepted')
}

export async function declineBadge(grantId: string) {
  return setAcceptance(grantId, 'declined')
}

export async function setBadgeHidden(input: {
  grantId: string
  hidden: boolean
}): Promise<ActionResult<{ grantId: string }>> {
  if (!input.grantId) return { ok: false, error: 'id_required' }
  const client = await getServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  const { error } = await client
    .from('user_badges')
    .update({ is_hidden: Boolean(input.hidden) })
    .eq('id', input.grantId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }

  const { data: profile } = await client
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()
  revalidatePath('/configuracion/insignias')
  if (profile?.username) revalidatePath(`/${profile.username}`)
  return { ok: true, data: { grantId: input.grantId } }
}
