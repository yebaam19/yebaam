'use server';

import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import {
  type ActionResult,
  requireUserId,
  revalidateCommunityPaths,
} from './_shared';

/**
 * Owner / admin moderation: invitations (by username or id) and join-request
 * review (approve / decline). RLS gates these to owners/admins; the pre-checks
 * here just produce friendlier errors than a raw permission failure.
 */

export async function inviteByUsername(input: {
  communityId: string;
  username: string;
}): Promise<ActionResult<{ inviteId: string; invitee: { id: string; username: string } }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const username = input.username.trim().replace(/^@/, '');
  if (!username) return { ok: false, error: 'Ingresa un usuario.' };

  const client = await getServerClient();
  const { data: profile } = await client
    .from('profiles')
    .select('id, username')
    .ilike('username', username)
    .maybeSingle();
  const p = profile as { id: string; username: string } | null;
  if (!p) return { ok: false, error: `No se encontró el usuario @${username}.` };
  if (p.id === userId) return { ok: false, error: 'No puedes invitarte a ti mismo.' };

  const result = await inviteToCommunity({ communityId: input.communityId, inviteeId: p.id });
  if (!result.ok) return result;
  return { ok: true, data: { inviteId: result.data.inviteId, invitee: p } };
}

export async function inviteToCommunity(input: {
  communityId: string;
  inviteeId: string;
}): Promise<ActionResult<{ inviteId: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();
  // RLS ensures only owners/admins can insert. We still pre-check to give a
  // friendlier error than a generic permission failure.
  const { data: c } = await client
    .from('communities')
    .select('owner_id, slug')
    .eq('id', input.communityId)
    .maybeSingle();
  if (!c) return { ok: false, error: 'Comunidad no encontrada.' };

  // Idempotent: if there's already a pending invite for this user, return it.
  const { data: existing } = await client
    .from('community_invitations')
    .select('id')
    .eq('community_id', input.communityId)
    .eq('invitee_id', input.inviteeId)
    .eq('status', 'pending')
    .maybeSingle();
  if (existing) {
    revalidateCommunityPaths((c as { slug: string }).slug);
    return { ok: true, data: { inviteId: (existing as { id: string }).id } };
  }

  const { data: invite, error } = await client
    .from('community_invitations')
    .insert({
      community_id: input.communityId,
      invitee_id: input.inviteeId,
      invited_by: userId,
      status: 'pending',
    })
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!invite) return { ok: false, error: 'No autorizado.' };

  revalidateCommunityPaths((c as { slug: string }).slug);
  return { ok: true, data: { inviteId: (invite as { id: string }).id } };
}

export async function approveJoinRequest(requestId: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();
  const { data: req } = await client
    .from('community_join_requests')
    .select('id, community_id, user_id, status')
    .eq('id', requestId)
    .maybeSingle();
  const r = req as
    | { id: string; community_id: string; user_id: string; status: string }
    | null;
  if (!r) return { ok: false, error: 'Solicitud no encontrada.' };
  if (r.status !== 'pending') return { ok: false, error: 'La solicitud ya fue procesada.' };

  // Mark approved (RLS: owner/admin only). Then insert the membership row;
  // its INSERT policy now sees an approved request and lets it through.
  const { error: updErr } = await client
    .from('community_join_requests')
    .update({
      status: 'approved',
      responded_at: new Date().toISOString(),
      responded_by: userId,
    })
    .eq('id', r.id);
  if (updErr) return { ok: false, error: updErr.message };

  const svc = getServiceClient();
  const { error: memErr } = await svc
    .from('community_members')
    .insert({
      community_id: r.community_id,
      user_id: r.user_id,
      role: 'MEMBER',
      status: 'active',
    });
  if (memErr && !memErr.message.includes('duplicate')) {
    return { ok: false, error: memErr.message };
  }

  const { data: c } = await client
    .from('communities')
    .select('slug')
    .eq('id', r.community_id)
    .maybeSingle();
  revalidateCommunityPaths((c as { slug?: string } | null)?.slug);
  return { ok: true, data: { id: requestId } };
}

export async function declineJoinRequest(requestId: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();
  const { data: req } = await client
    .from('community_join_requests')
    .select('id, community_id')
    .eq('id', requestId)
    .maybeSingle();
  const r = req as { id: string; community_id: string } | null;
  if (!r) return { ok: false, error: 'Solicitud no encontrada.' };

  const { error } = await client
    .from('community_join_requests')
    .update({
      status: 'declined',
      responded_at: new Date().toISOString(),
      responded_by: userId,
    })
    .eq('id', r.id);
  if (error) return { ok: false, error: error.message };

  const { data: c } = await client
    .from('communities')
    .select('slug')
    .eq('id', r.community_id)
    .maybeSingle();
  revalidateCommunityPaths((c as { slug?: string } | null)?.slug);
  return { ok: true, data: { id: requestId } };
}
