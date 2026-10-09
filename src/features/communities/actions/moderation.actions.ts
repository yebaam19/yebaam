'use server';

import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { canPublishCommunityArticle } from '../server/community-articles.server';

import {
  type ActionResult,
  requireUserId,
  revalidateCommunityPaths,
} from './_shared';

/**
 * Owner / admin moderation: invitations (by username or id) and direct adds.
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

/**
 * Owner / admin directly adds an existing user to the community by @username —
 * the "Agregar persona" flow, distinct from the invitation flow above.
 *
 * Authorization reuses {@link canPublishCommunityArticle} (true for the owner or
 * an OWNER/ADMIN community_members row). The membership row is inserted with the
 * SERVICE client because the community_members INSERT RLS requires
 * auth.uid() = user_id, so a session-bound client cannot add *another* user.
 *
 * member_count is left untouched on purpose: the AFTER INSERT trigger
 * `tg_community_member_counter` already increments it.
 */
export async function addCommunityMemberByUsernameAction(
  communityId: string,
  username: string,
): Promise<ActionResult<{ user: { id: string; username: string } }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: 'Debes iniciar sesión.' };

  const allowed = await canPublishCommunityArticle(communityId);
  if (!allowed) return { ok: false, error: 'No tienes permiso para agregar miembros.' };

  const normalized = username.trim().replace(/^@/, '');
  if (!normalized) return { ok: false, error: 'Ingresa un usuario.' };

  const client = await getServerClient();
  const { data: profile } = await client
    .from('profiles')
    .select('id, username')
    .ilike('username', normalized)
    .maybeSingle();
  const p = profile as { id: string; username: string } | null;
  if (!p) return { ok: false, error: `No se encontró el usuario @${normalized}.` };

  // Dedupe: any existing membership row (active or otherwise) blocks a re-add.
  const { data: existing } = await client
    .from('community_members')
    .select('user_id')
    .eq('community_id', communityId)
    .eq('user_id', p.id)
    .maybeSingle();
  if (existing) return { ok: false, error: 'Ya es miembro de la comunidad.' };

  // Service client: community_members INSERT RLS demands auth.uid() = user_id,
  // so the caller's session client cannot insert a row for another user.
  const svc = getServiceClient();
  const { error } = await svc
    .from('community_members')
    .insert({ community_id: communityId, user_id: p.id, role: 'MEMBER', status: 'active' });
  if (error) {
    if (error.message.includes('duplicate')) {
      return { ok: false, error: 'Ya es miembro de la comunidad.' };
    }
    return { ok: false, error: error.message };
  }

  const { data: c } = await client
    .from('communities')
    .select('slug')
    .eq('id', communityId)
    .maybeSingle();
  revalidateCommunityPaths((c as { slug?: string } | null)?.slug);
  return { ok: true, data: { user: p } };
}
