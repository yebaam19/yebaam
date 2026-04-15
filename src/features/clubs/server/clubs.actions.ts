'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/utils/supabase/server';
import type { ClubPostKind } from './clubs.server';

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
