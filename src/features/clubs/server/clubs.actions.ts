'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { ensureClubPublicChat } from '@/lib/api/clubs';
import type { ClubPostKind } from './clubs.server';

async function addUserToClubPublicChat(clubId: string, userId: string): Promise<void> {
  const svc = getServiceClient();

  let { data: conv } = await svc
    .from('conversations')
    .select('id')
    .eq('club_id', clubId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!conv) {
    const { data: club } = await svc
      .from('clubs')
      .select('id, name, owner_id')
      .eq('id', clubId)
      .maybeSingle();
    if (!club) return;
    const provisioned = await ensureClubPublicChat({
      id: (club as { id: string }).id,
      name: (club as { name: string }).name,
      owner_id: (club as { owner_id: string }).owner_id,
    });
    if (!provisioned) return;
    conv = { id: provisioned.conversationId };
  }

  await svc
    .from('conversation_participants')
    .upsert(
      { conversation_id: (conv as { id: string }).id, user_id: userId },
      { onConflict: 'conversation_id,user_id', ignoreDuplicates: true },
    );
}

async function removeUserFromClubPublicChat(clubId: string, userId: string): Promise<void> {
  const svc = getServiceClient();
  const { data: conv } = await svc
    .from('conversations')
    .select('id')
    .eq('club_id', clubId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!conv) return;
  await svc
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', (conv as { id: string }).id)
    .eq('user_id', userId);
}

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireUser() {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data?.user) return { client, userId: null as string | null };
  return { client, userId: data.user.id };
}

export async function joinClubAction(clubId: string): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { error } = await client
    .from('club_members')
    .upsert(
      { club_id: clubId, user_id: userId, role: 'MEMBER', membership_tier: 'FREE' },
      { onConflict: 'club_id,user_id' },
    );
  if (error) return { ok: false, error: error.message };
  await addUserToClubPublicChat(clubId, userId).catch((err) => {
    console.error('[joinClubAction] addUserToClubPublicChat failed', err);
  });
  revalidatePath(`/feed/clubs/[slug]`, 'page');
  return { ok: true };
}

export async function leaveClubAction(clubId: string): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { error } = await client
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', userId);
  if (error) return { ok: false, error: error.message };
  await removeUserFromClubPublicChat(clubId, userId).catch((err) => {
    console.error('[leaveClubAction] removeUserFromClubPublicChat failed', err);
  });
  revalidatePath(`/feed/clubs/[slug]`, 'page');
  return { ok: true };
}

export async function inviteToClubAction(
  clubId: string,
  inviteeId: string,
): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };
  if (inviteeId === userId) return { ok: false, error: 'No puedes invitarte a ti mismo' };

  const { data, error } = await client
    .from('club_invites')
    .upsert(
      { club_id: clubId, inviter_id: userId, invitee_id: inviteeId, status: 'PENDING' },
      { onConflict: 'club_id,invitee_id' },
    )
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? { id: data.id as string } : undefined };
}

async function canManageClubMembers(
  client: Awaited<ReturnType<typeof getServerClient>>,
  clubId: string,
  userId: string,
): Promise<boolean> {
  const { data: club } = await client
    .from('clubs')
    .select('owner_id')
    .eq('id', clubId)
    .maybeSingle();
  if ((club as { owner_id: string } | null)?.owner_id === userId) return true;

  const { data: membership } = await client
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .maybeSingle();
  const role = (membership as { role: string } | null)?.role;
  return role === 'OWNER' || role === 'ADMIN';
}

export async function updateClubImagesAction(
  clubId: string,
  fields: { profileImageUrl?: string; coverImageUrl?: string },
): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { data: club } = await client
    .from('clubs')
    .select('owner_id')
    .eq('id', clubId)
    .maybeSingle();
  if (!club) return { ok: false, error: 'Club no encontrado' };
  if ((club as { owner_id: string }).owner_id !== userId) {
    return { ok: false, error: 'Solo el propietario puede cambiar las imágenes' };
  }

  const patch: Record<string, string | null> = { updated_at: new Date().toISOString() };
  if (fields.profileImageUrl !== undefined) patch.profile_image_url = fields.profileImageUrl;
  if (fields.coverImageUrl !== undefined) patch.cover_image_url = fields.coverImageUrl;
  if (Object.keys(patch).length === 1) {
    return { ok: false, error: 'No hay cambios para guardar' };
  }

  const { error } = await client.from('clubs').update(patch).eq('id', clubId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/feed/clubs/[slug]', 'page');
  return { ok: true };
}

export async function addClubMemberByUsernameAction(
  clubId: string,
  username: string,
): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const canManage = await canManageClubMembers(client, clubId, userId);
  if (!canManage) return { ok: false, error: 'No tienes permiso para agregar miembros' };

  const normalized = username.trim().replace(/^@/, '');
  if (!normalized) return { ok: false, error: 'Escribe un @username' };

  const { data: profile } = await client
    .from('profiles')
    .select('id, username')
    .ilike('username', normalized)
    .maybeSingle();
  if (!profile) return { ok: false, error: 'Usuario no encontrado' };

  const inviteeId = (profile as { id: string }).id;
  if (inviteeId === userId) return { ok: false, error: 'No puedes agregarte a ti mismo' };

  const { data: existingMember } = await client
    .from('club_members')
    .select('user_id')
    .eq('club_id', clubId)
    .eq('user_id', inviteeId)
    .maybeSingle();
  if (existingMember) return { ok: false, error: 'Ya es miembro del club' };

  const { error } = await client.from('club_members').insert({
    club_id: clubId,
    user_id: inviteeId,
    role: 'MEMBER',
    membership_tier: 'FREE',
  });
  if (error) return { ok: false, error: error.message };

  await addUserToClubPublicChat(clubId, inviteeId).catch((err) => {
    console.error('[addClubMemberByUsernameAction] addUserToClubPublicChat failed', err);
  });

  revalidatePath('/feed/clubs/[slug]', 'page');
  return { ok: true };
}

export interface CreateClubPostInput {
  clubId: string;
  kind: ClubPostKind;
  title?: string;
  body?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  albumId?: string;
}

export async function createClubPostAction(
  input: CreateClubPostInput,
): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { data, error } = await client
    .from('club_posts')
    .insert({
      club_id: input.clubId,
      author_id: userId,
      kind: input.kind,
      title: input.title ?? null,
      body: input.body ?? null,
      media_url: input.mediaUrl ?? null,
      thumbnail_url: input.thumbnailUrl ?? null,
      album_id: input.albumId ?? null,
    })
    .select('id')
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo crear la publicación' };
  revalidatePath(`/feed/clubs/[slug]`, 'page');
  return { ok: true, data: { id: data.id as string } };
}

export async function reportClubPostAction(
  clubId: string,
  postId: string,
  reason: string,
): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { error } = await client
    .from('club_reports')
    .insert({ club_id: clubId, post_id: postId, reporter_id: userId, reason });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteClubPostAction(postId: string): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { error } = await client.from('club_posts').delete().eq('id', postId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/feed/clubs/[slug]`, 'page');
  return { ok: true };
}

export async function assignClubRoleAction(
  clubId: string,
  targetUserId: string,
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER',
): Promise<ActionResult> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { error } = await client
    .from('club_members')
    .update({ role })
    .eq('club_id', clubId)
    .eq('user_id', targetUserId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/feed/clubs/[slug]`, 'page');
  return { ok: true };
}
