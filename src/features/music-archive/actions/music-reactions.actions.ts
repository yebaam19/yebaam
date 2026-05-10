'use server';

import { revalidatePath } from 'next/cache';
import { requireSession, type ActionResult } from './_shared';
import type { AlbumReactionKind } from '../types/music.types';

/** Toggle a viewer's reaction on an album. If they had the same reaction it's
 *  removed; otherwise their row is upserted to the new reaction. Returns the
 *  new viewer reaction (or null if cleared). */
export async function toggleAlbumReaction(
  albumId: string,
  reaction: AlbumReactionKind,
): Promise<ActionResult<{ reaction: AlbumReactionKind | null }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión para reaccionar.' };
  const { client, userId } = session;

  const { data: existing } = await client
    .from('music_album_reactions')
    .select('reaction')
    .eq('album_id', albumId)
    .eq('user_id', userId)
    .maybeSingle();
  const cur = (existing as { reaction: AlbumReactionKind } | null)?.reaction ?? null;

  if (cur === reaction) {
    const { error } = await client
      .from('music_album_reactions')
      .delete()
      .eq('album_id', albumId)
      .eq('user_id', userId);
    if (error) return { ok: false, error: error.message };
    await revalidateAlbum(client, albumId);
    return { ok: true, data: { reaction: null } };
  }

  const { error } = await client
    .from('music_album_reactions')
    .upsert(
      { album_id: albumId, user_id: userId, reaction },
      { onConflict: 'album_id,user_id' },
    );
  if (error) return { ok: false, error: error.message };
  await revalidateAlbum(client, albumId);
  return { ok: true, data: { reaction } };
}

async function revalidateAlbum(
  client: Awaited<ReturnType<typeof import('@/utils/supabase/server').getServerClient>>,
  albumId: string,
) {
  const { data } = await client
    .from('music_albums')
    .select('slug')
    .eq('id', albumId)
    .maybeSingle();
  const slug = (data as { slug: string } | null)?.slug;
  if (slug) revalidatePath(`/musica/albumes/${slug}`);
}
