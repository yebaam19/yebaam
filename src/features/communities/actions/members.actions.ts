'use server';

import { getServerClient } from '@/utils/supabase/server';
import {
  type ActionResult,
  requireUserId,
  revalidateCommunityPaths,
} from './_shared';

type JoinOutcome = 'joined' | 'requested' | 'invited_join' | 'already_member';

export async function joinCommunity(
  id: string,
  opts?: { message?: string },
): Promise<ActionResult<{ id: string; outcome: JoinOutcome }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();

  const { data: community } = await client
    .from('communities')
    .select('id, slug, privacy, owner_id')
    .eq('id', id)
    .maybeSingle();
  const c = community as
    | { id: string; slug: string; privacy: 'PUBLIC' | 'PRIVATE' | 'SECRET'; owner_id: string }
    | null;
  if (!c) return { ok: false, error: 'Comunidad no encontrada.' };

  // Already a member? No-op.
  const { data: existing } = await client
    .from('community_members')
    .select('user_id')
    .eq('community_id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) {
    revalidateCommunityPaths(c.slug);
    return { ok: true, data: { id, outcome: 'already_member' } };
  }

  if (c.privacy === 'PUBLIC' || c.owner_id === userId) {
    const { error } = await client
      .from('community_members')
      .insert({ community_id: id, user_id: userId, role: 'MEMBER', status: 'active' });
    if (error) return { ok: false, error: error.message };
    revalidateCommunityPaths(c.slug);
    return { ok: true, data: { id, outcome: 'joined' } };
  }

  if (c.privacy === 'SECRET') {
    // Must hold a pending invitation. Consume it inside a transactional pair:
    // mark invitation accepted, then insert membership. RLS on community_members
    // INSERT also re-checks the invitation, so this is defense-in-depth.
    const { data: invite } = await client
      .from('community_invitations')
      .select('id')
      .eq('community_id', id)
      .eq('invitee_id', userId)
      .eq('status', 'pending')
      .maybeSingle();
    if (!invite) {
      return { ok: false, error: 'Esta comunidad es secreta. Necesitas una invitación.' };
    }

    const { error: insErr } = await client
      .from('community_members')
      .insert({ community_id: id, user_id: userId, role: 'MEMBER', status: 'active' });
    if (insErr) return { ok: false, error: insErr.message };

    await client
      .from('community_invitations')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', (invite as { id: string }).id);

    revalidateCommunityPaths(c.slug);
    return { ok: true, data: { id, outcome: 'invited_join' } };
  }

  // PRIVATE — submit a join request (idempotent against an existing pending row).
  const { data: existingReq } = await client
    .from('community_join_requests')
    .select('id')
    .eq('community_id', id)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (!existingReq) {
    const { error } = await client
      .from('community_join_requests')
      .insert({
        community_id: id,
        user_id: userId,
        status: 'pending',
        message: opts?.message ?? null,
      });
    if (error) return { ok: false, error: error.message };
  }

  revalidateCommunityPaths(c.slug);
  return { ok: true, data: { id, outcome: 'requested' } };
}

export async function cancelJoinRequest(communityId: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();
  const { data: request, error: lookupError } = await client
    .from('community_join_requests')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();
  if (lookupError) return { ok: false, error: lookupError.message };
  if (!request) return { ok: false, error: 'No hay solicitud pendiente.' };

  const { error } = await client.rpc('change_community_join_request', {
    target_request: request.id,
    decision: 'cancelled',
  });
  if (error) return { ok: false, error: error.message };

  const { data: c } = await client
    .from('communities')
    .select('slug')
    .eq('id', communityId)
    .maybeSingle();
  revalidateCommunityPaths((c as { slug?: string } | null)?.slug);
  return { ok: true, data: { id: communityId } };
}

/** Submit by ID from the minimal preview; RLS verifies identity and privacy. */
export async function requestPrivateCommunityAccess(
  communityId: string,
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();
  const { data: prior, error: lookupError } = await client.from('community_join_requests')
    .select('status').eq('community_id', communityId).eq('user_id', userId)
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .limit(1).maybeSingle();
  if (lookupError) return { ok: false, error: lookupError.message };
  if (prior?.status === 'declined') {
    return { ok: false, error: 'Esta solicitud ya fue rechazada.' };
  }
  if (prior?.status !== 'pending') {
    const { error } = await client.from('community_join_requests').insert({
      community_id: communityId,
      user_id: userId,
      status: 'pending',
    });
    if (error) {
      // A concurrent click may have inserted the same pending row.
      const { data: pending } = await client.from('community_join_requests')
        .select('id').eq('community_id', communityId).eq('user_id', userId)
        .eq('status', 'pending').maybeSingle();
      if (!pending) return { ok: false, error: error.message };
    }
  }

  revalidateCommunityPaths();
  return { ok: true, data: { id: communityId } };
}

export async function leaveCommunity(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const client = await getServerClient();
  const { data: community } = await client
    .from('communities')
    .select('owner_id, slug')
    .eq('id', id)
    .maybeSingle();
  const c = community as { owner_id: string; slug: string } | null;
  if (!c) return { ok: false, error: 'Comunidad no encontrada.' };
  if (c.owner_id === userId) {
    return {
      ok: false,
      error: 'El propietario no puede abandonar su propia comunidad. Cede la administración o eliminala.',
    };
  }

  const { error } = await client
    .from('community_members')
    .delete()
    .eq('community_id', id)
    .eq('user_id', userId);
  if (error) return { ok: false, error: error.message };

  revalidateCommunityPaths(c.slug);
  return { ok: true, data: { id } };
}
