'use server';

import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/utils/supabase/server';
import { adminGate, revalidateAlbumById, type ActionResult } from './_shared';

/** Atomically replace an album's club membership set + mark the new primary.
 *  Single round trip; safe to call from a multi-select form. */
export async function setAlbumClubs(
  albumId: string,
  clubIds: string[],
  primaryClubId: string | null,
): Promise<ActionResult<{ albumId: string; clubCount: number }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();

  // Wipe existing rows for this album then re-insert. The album_id cascade
  // means we won't orphan anything, and the unique constraint catches dupes.
  const { error: delErr } = await service
    .from('music_album_clubs')
    .delete()
    .eq('album_id', albumId);
  if (delErr) return { ok: false, error: delErr.message };

  if (clubIds.length === 0) {
    await revalidateAlbumById(service, albumId);
    revalidatePath('/musica/clubes');
    return { ok: true, data: { albumId, clubCount: 0 } };
  }

  const rows = clubIds.map((club_id) => ({
    album_id: albumId,
    club_id,
    is_primary: club_id === primaryClubId,
  }));
  const { error: insErr } = await service.from('music_album_clubs').insert(rows);
  if (insErr) return { ok: false, error: insErr.message };

  // Revalidate the album page + every club page that may now show/hide this album.
  const { data: clubSlugs } = await service
    .from('clubs')
    .select('slug')
    .in('id', clubIds);
  for (const c of (clubSlugs ?? []) as Array<{ slug: string }>) {
    revalidatePath(`/musica/clubes/${c.slug}`);
  }
  await revalidateAlbumById(service, albumId);
  revalidatePath('/musica/clubes');
  revalidatePath('/musica');
  return { ok: true, data: { albumId, clubCount: clubIds.length } };
}

export async function addAlbumToClub(
  albumId: string,
  clubId: string,
  isPrimary = false,
): Promise<ActionResult<{ id: string }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();

  // If marking primary, clear any existing primary for this album.
  if (isPrimary) {
    await service
      .from('music_album_clubs')
      .update({ is_primary: false })
      .eq('album_id', albumId);
  }

  const { data, error } = await service
    .from('music_album_clubs')
    .upsert(
      { album_id: albumId, club_id: clubId, is_primary: isPrimary },
      { onConflict: 'album_id,club_id' },
    )
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };

  const { data: c } = await service
    .from('clubs')
    .select('slug')
    .eq('id', clubId)
    .maybeSingle();
  if (c) revalidatePath(`/musica/clubes/${(c as { slug: string }).slug}`);
  await revalidateAlbumById(service, albumId);
  return { ok: true, data: { id: (data as { id: string }).id } };
}

export async function removeAlbumFromClub(
  albumId: string,
  clubId: string,
): Promise<ActionResult<{ removed: true }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  const { error } = await service
    .from('music_album_clubs')
    .delete()
    .eq('album_id', albumId)
    .eq('club_id', clubId);
  if (error) return { ok: false, error: error.message };

  const { data: c } = await service
    .from('clubs')
    .select('slug')
    .eq('id', clubId)
    .maybeSingle();
  if (c) revalidatePath(`/musica/clubes/${(c as { slug: string }).slug}`);
  await revalidateAlbumById(service, albumId);
  return { ok: true, data: { removed: true } };
}

/** Read all MUSICA clubs (id + name + slug + genre) for the admin multi-select
 *  in the album editor. Server action so the client component can fetch on
 *  open without bundling a server-only helper. */
export async function listMusicClubsForPicker(): Promise<
  ActionResult<Array<{ id: string; name: string; slug: string; genre_slug: string; genre_name: string }>>
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  const { data, error } = await service
    .from('clubs')
    .select('id, name, slug, music_genres!inner(slug, name)')
    .eq('category', 'MUSICA')
    .not('music_genre_id', 'is', null)
    .order('name', { ascending: true });
  if (error) return { ok: false, error: error.message };
  type GenreJoin = { slug: string; name: string } | Array<{ slug: string; name: string }> | null;
  type Row = { id: string; name: string; slug: string; music_genres: GenreJoin };
  return {
    ok: true,
    data: ((data ?? []) as unknown as Row[])
      .map((r) => {
        const g = Array.isArray(r.music_genres) ? r.music_genres[0] : r.music_genres;
        return {
          id: r.id,
          name: r.name,
          slug: r.slug,
          genre_slug: g?.slug ?? '',
          genre_name: g?.name ?? '',
        };
      })
      .sort((a, b) => a.genre_name.localeCompare(b.genre_name, 'es')),
  };
}

/** Read the current club ids + primary id for an album. Used by the editor to
 *  prefill the multi-select on open. */
export async function getAlbumClubAssignments(
  albumId: string,
): Promise<ActionResult<{ clubIds: string[]; primaryClubId: string | null }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  const { data, error } = await service
    .from('music_album_clubs')
    .select('club_id, is_primary')
    .eq('album_id', albumId);
  if (error) return { ok: false, error: error.message };
  const rows = (data ?? []) as Array<{ club_id: string; is_primary: boolean }>;
  return {
    ok: true,
    data: {
      clubIds: rows.map((r) => r.club_id),
      primaryClubId: rows.find((r) => r.is_primary)?.club_id ?? null,
    },
  };
}
