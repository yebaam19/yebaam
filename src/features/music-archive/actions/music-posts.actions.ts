'use server';

import { revalidatePath } from 'next/cache';
import { requireSession, type ActionResult } from './_shared';

interface CreatePostDto {
  clubId: string;
  kind?: string;
  title?: string | null;
  body?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  albumId?: string | null;
}

/** Post into a music club's feed. Author must be a member of the club (RLS
 *  also enforces this, but we pre-check for a friendlier error). */
export async function createMusicClubPost(
  dto: CreatePostDto,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión para publicar.' };
  const { client, userId } = session;
  if (!dto.body && !dto.title && !dto.mediaUrl) {
    return { ok: false, error: 'Escribe algo antes de publicar.' };
  }
  const { data: cm } = await client
    .from('club_members')
    .select('role')
    .eq('club_id', dto.clubId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!cm) return { ok: false, error: 'Únete al club para publicar.' };
  const { data, error } = await client
    .from('club_posts')
    .insert({
      club_id: dto.clubId,
      author_id: userId,
      kind: dto.kind ?? 'note',
      title: dto.title?.trim() || null,
      body: dto.body?.trim() || null,
      media_url: dto.mediaUrl || null,
      thumbnail_url: dto.thumbnailUrl || null,
      album_id: dto.albumId || null,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  const { data: c } = await client
    .from('clubs')
    .select('slug')
    .eq('id', dto.clubId)
    .maybeSingle();
  const slug = (c as { slug: string } | null)?.slug;
  if (slug) revalidatePath(`/musica/clubes/${slug}/posts`);
  return { ok: true, data: { id: (data as { id: string }).id } };
}

/** Delete a post. Author or club admin only (RLS enforces). */
export async function deleteMusicClubPost(
  postId: string,
): Promise<ActionResult<{ removed: true }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión.' };
  const { client } = session;
  const { data: post } = await client
    .from('club_posts')
    .select('club_id')
    .eq('id', postId)
    .maybeSingle();
  const { error } = await client.from('club_posts').delete().eq('id', postId);
  if (error) return { ok: false, error: error.message };
  if (post) {
    const { data: c } = await client
      .from('clubs')
      .select('slug')
      .eq('id', (post as { club_id: string }).club_id)
      .maybeSingle();
    const slug = (c as { slug: string } | null)?.slug;
    if (slug) revalidatePath(`/musica/clubes/${slug}/posts`);
  }
  return { ok: true, data: { removed: true } };
}
