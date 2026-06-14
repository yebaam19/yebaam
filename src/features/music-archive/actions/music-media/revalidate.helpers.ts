import { revalidatePath } from 'next/cache';

export function revalidateForItem(item: {
  artists: Array<{ slug: string }>;
  albums: Array<{ slug: string }>;
  clubs: Array<{ slug: string }>;
}) {
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
  revalidatePath('/musica');
  revalidatePath('/admin/music');
}
