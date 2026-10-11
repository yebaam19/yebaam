import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getServerClient } from '@/utils/supabase/server';
import { getPublicServerClient } from '@/utils/supabase/public-server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import {
  CLUB_SELECT,
  mapClubRow,
  type ClubRowRaw,
} from './club-shape.helpers';

export interface MusicClubRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  music_genre_id: string;
  /** Slug from the joined `music_genres` row. Kept flat for the legacy
   *  `music_genre` field — UI code that used to do `genre.replace(/_/g, ' ')`
   *  can just read `genre_name` now. */
  genre_slug: string;
  genre_name: string;
  cover_image_url: string | null;
  profile_image_url: string | null;
  album_count: number;
  member_count: number;
}

/** Anonymous rows are safe to share; a signed-in viewer can see private clubs. */
async function readMusicClubs(client: Awaited<ReturnType<typeof getServerClient>>): Promise<MusicClubRow[]> {
  const { data: clubs, error } = await client
    .from('clubs')
    .select(CLUB_SELECT)
    .eq('category', 'MUSICA')
    .not('music_genre_id', 'is', null)
    .order('name', { ascending: true });
  if (error) throw error;
  const rows = (clubs ?? []) as unknown as ClubRowRaw[];

  // Embedded counts remain session/RLS-scoped, transfer no member/link rows,
  // and aren't truncated by PostgREST's row limit on those related tables.
  return rows
    .map((r) =>
      mapClubRow(r, {
        albumCount: r.music_album_clubs?.[0]?.count ?? 0,
        memberCount: r.club_members?.[0]?.count ?? 0,
      }),
    )
    .sort((a, b) => b.album_count - a.album_count || a.name.localeCompare(b.name));
}

const loadPublicMusicClubs = unstable_cache(
  async () => readMusicClubs(getPublicServerClient()),
  ['public-music-clubs-v1'],
  { revalidate: 60 },
);

/** Shared for anonymous crawlers; session/RLS-bound for signed-in viewers. */
export const listMusicClubs = cache(async (): Promise<MusicClubRow[]> => {
  try {
    const viewer = await getCachedAuthUser();
    return await (viewer ? readMusicClubs(await getServerClient()) : loadPublicMusicClubs());
  } catch {
    return [];
  }
});

export const getMusicClubBySlug = cache(async (slug: string): Promise<MusicClubRow | null> => {
  const client = await getServerClient();
  const { data: club } = await client
    .from('clubs')
    .select(CLUB_SELECT)
    .eq('category', 'MUSICA')
    .eq('slug', slug)
    .maybeSingle();
  if (!club) return null;
  const c = club as unknown as ClubRowRaw;

  return mapClubRow(c, {
    albumCount: c.music_album_clubs?.[0]?.count ?? 0,
    memberCount: c.club_members?.[0]?.count ?? 0,
  });
});

/** All clubs an album is tagged into. Used by the album detail page for the
 *  small genre chips below the metadata grid. */
export const listClubsForAlbum = cache(
  async (albumId: string): Promise<Array<{ id: string; name: string; slug: string; is_primary: boolean }>> => {
    const client = await getServerClient();
    const { data } = await client
      .from('music_album_clubs')
      .select('is_primary, clubs!inner(id, name, slug)')
      .eq('album_id', albumId);
    type Row = {
      is_primary: boolean;
      clubs: { id: string; name: string; slug: string } | Array<{ id: string; name: string; slug: string }>;
    };
    return ((data as unknown as Row[] | null) ?? [])
      .map((r) => {
        const c = Array.isArray(r.clubs) ? r.clubs[0] : r.clubs;
        return c ? { ...c, is_primary: r.is_primary } : null;
      })
      .filter((x): x is { id: string; name: string; slug: string; is_primary: boolean } => x !== null)
      .sort((a, b) => (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1));
  },
);
