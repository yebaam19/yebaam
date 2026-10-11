import { revalidatePath, updateTag } from 'next/cache';
import { MUSIC_MEDIA_CACHE_TAG } from '../../server/music-media.server';

export function revalidateForItem(item: {
  artists: Array<{ slug: string }>;
  albums: Array<{ slug: string }>;
  clubs: Array<{ slug: string }>;
}) {
  updateTag(MUSIC_MEDIA_CACHE_TAG);
  revalidatePath('/musica');
  revalidatePath('/admin/music');
  for (const a of item.artists) revalidatePath(`/musica/artistas/${a.slug}`);
  for (const a of item.albums) revalidatePath(`/musica/albumes/${a.slug}`);
  for (const c of item.clubs) {
    revalidatePath(`/musica/clubes/${c.slug}`);
    revalidatePath(`/musica/clubes/${c.slug}/galeria`);
  }
}

/** Revalidate the two always-affected music-media surfaces: the public gallery
 *  and the admin list. Used by create + update after a successful mutation. */
export function revalidateMusicMediaBase() {
  updateTag(MUSIC_MEDIA_CACHE_TAG);
  revalidatePath('/musica');
  revalidatePath('/admin/music');
}
