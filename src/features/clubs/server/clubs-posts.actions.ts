'use server';

import { revalidateClubPaths } from './clubs-helpers';
import { ActionResult,CreateClubPostInput,requireUser,sanitizeMedia } from './clubs-helpers';
import type { ClubPostKind } from './clubs.server';

export async function createClubPostAction(
  input: CreateClubPostInput,
): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const body = (input.body ?? '').trim();
  const media = sanitizeMedia(input.media);
  if (!body && !input.title && media.length === 0) {
    return { ok: false, error: 'La publicación no puede estar vacía' };
  }

  // Derive the post kind from the attached media when present so the existing
  // fotos / videos tabs (which filter by `kind`) pick the post up.
  const hasImage = media.some((m) => m.kind === 'image');
  const hasVideo = media.some((m) => m.kind === 'video');
  const kind: ClubPostKind =
    input.kind ?? (hasImage ? 'PHOTO' : hasVideo ? 'VIDEO' : 'NOTE');

  const { data, error } = await client
    .from('club_posts')
    .insert({
      club_id: input.clubId,
      author_id: userId,
      kind,
      title: input.title ?? null,
      body: body || null,
      media,
      album_id: input.albumId ?? null,
    })
    .select('id')
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo crear la publicación' };
  revalidateClubPaths();
  return { ok: true, data: { id: data.id as string } };
}

/**
 * Toggle the current user's "like" on a club post (used for the club photo
 * lightbox). The DB trigger keeps club_posts.reactions_count in sync; we read
 * it back fresh after the toggle. RLS lets anyone who can see the club react.
 */
export async function toggleClubPostReactionAction(
  postId: string,
): Promise<ActionResult<{ liked: boolean; count: number }>> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const { data: existing } = await client
    .from('club_post_reactions')
    .select('user_id')
    .eq('club_post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  let liked: boolean;
  if (existing) {
    const { error } = await client
      .from('club_post_reactions')
      .delete()
      .eq('club_post_id', postId)
      .eq('user_id', userId);
    if (error) return { ok: false, error: error.message };
    liked = false;
  } else {
    const { error } = await client
      .from('club_post_reactions')
      .insert({ club_post_id: postId, user_id: userId, type: 'like' });
    if (error) return { ok: false, error: error.message };
    liked = true;
  }

  const { data: post } = await client
    .from('club_posts')
    .select('reactions_count')
    .eq('id', postId)
    .maybeSingle();
  const count = (post as { reactions_count: number } | null)?.reactions_count ?? 0;

  revalidateClubPaths();
  return { ok: true, data: { liked, count } };
}
