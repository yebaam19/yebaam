import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import type {
  ClubLinkRow,
  ClubMemberRow,
  ClubPostRow,
  MusicAlbumRow,
} from '../../types/music.types';
import { fetchProfilesByUserIds } from './_shared.server';

export interface AlbumForClub extends MusicAlbumRow {
  is_primary: boolean;
  artist_name: string;
  artist_slug: string;
}

/** Albums tagged to this club. Primary genre first, then chronological. */
export const listAlbumsForClub = cache(async (clubId: string): Promise<AlbumForClub[]> => {
  const client = await getServerClient();
  const { data, error } = await client
    .from('music_album_clubs')
    .select(
      'is_primary, music_albums!inner(*, music_artists!inner(name, slug))',
    )
    .eq('club_id', clubId)
    .order('is_primary', { ascending: false });
  if (error || !data) return [];

  type Row = {
    is_primary: boolean;
    music_albums:
      | (MusicAlbumRow & { music_artists: { name: string; slug: string } | Array<{ name: string; slug: string }> })
      | Array<MusicAlbumRow & { music_artists: { name: string; slug: string } | Array<{ name: string; slug: string }> }>;
  };
  const rows = data as unknown as Row[];

  return rows
    .map<AlbumForClub | null>((r) => {
      const alb = Array.isArray(r.music_albums) ? r.music_albums[0] : r.music_albums;
      if (!alb) return null;
      const artist = Array.isArray(alb.music_artists) ? alb.music_artists[0] : alb.music_artists;
      return {
        ...(alb as MusicAlbumRow),
        is_primary: r.is_primary,
        artist_name: artist?.name ?? 'Desconocido',
        artist_slug: artist?.slug ?? '',
      };
    })
    .filter((a): a is AlbumForClub => a !== null)
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return (a.year ?? 0) - (b.year ?? 0);
    });
});

/** Artists with ≥1 album tagged to this club. Used by the Artistas tab. */
export const listClubArtists = cache(
  async (
    clubId: string,
  ): Promise<Array<{ id: string; name: string; slug: string; photo_cf_image_id: string | null; album_count: number }>> => {
    const client = await getServerClient();
    const { data } = await client
      .from('music_album_clubs')
      .select('music_albums!inner(artist_id, music_artists!inner(id, name, slug, photo_cf_image_id))')
      .eq('club_id', clubId);
    type Row = {
      music_albums:
        | { artist_id: string; music_artists: { id: string; name: string; slug: string; photo_cf_image_id: string | null } | Array<{ id: string; name: string; slug: string; photo_cf_image_id: string | null }> }
        | Array<{ artist_id: string; music_artists: { id: string; name: string; slug: string; photo_cf_image_id: string | null } | Array<{ id: string; name: string; slug: string; photo_cf_image_id: string | null }> }>;
    };
    const rows = (data as unknown as Row[] | null) ?? [];
    const byId = new Map<string, { id: string; name: string; slug: string; photo_cf_image_id: string | null; album_count: number }>();
    for (const r of rows) {
      const alb = Array.isArray(r.music_albums) ? r.music_albums[0] : r.music_albums;
      if (!alb) continue;
      const ar = Array.isArray(alb.music_artists) ? alb.music_artists[0] : alb.music_artists;
      if (!ar) continue;
      const prev = byId.get(ar.id);
      if (prev) prev.album_count += 1;
      else byId.set(ar.id, { ...ar, album_count: 1 });
    }
    return [...byId.values()].sort(
      (a, b) => b.album_count - a.album_count || a.name.localeCompare(b.name),
    );
  },
);

export const listClubMembers = cache(async (clubId: string): Promise<ClubMemberRow[]> => {
  const client = await getServerClient();
  const { data } = await client
    .from('club_members')
    .select('user_id, club_id, role, joined_at')
    .eq('club_id', clubId)
    .eq('status', 'approved')
    .order('joined_at', { ascending: true });
  type Row = { user_id: string; club_id: string; role: string; joined_at: string };
  const rows = (data as Row[] | null) ?? [];
  const profiles = await fetchProfilesByUserIds(
    client,
    rows.map((r) => r.user_id),
  );
  const allowed = new Set(['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER']);
  return rows.map((r) => {
    const p = profiles.get(r.user_id);
    return {
      user_id: r.user_id,
      club_id: r.club_id,
      role: (allowed.has(r.role) ? r.role : 'MEMBER') as ClubMemberRow['role'],
      joined_at: r.joined_at,
      username: p?.username ?? null,
      full_name: p?.full_name ?? null,
      avatar_cf_image_id: p?.avatar_cf_image_id ?? null,
    };
  });
});

export const listClubLinks = cache(async (clubId: string): Promise<ClubLinkRow[]> => {
  const client = await getServerClient();
  const { data } = await client
    .from('club_links')
    .select('*')
    .eq('club_id', clubId)
    .order('kind', { ascending: true })
    .order('created_at', { ascending: false });
  return ((data as ClubLinkRow[] | null) ?? []);
});

export const listClubPosts = cache(
  async (clubId: string, limit = 30): Promise<ClubPostRow[]> => {
    const client = await getServerClient();
    const { data } = await client
      .from('club_posts')
      .select(
        'id, club_id, author_id, kind, title, body, media_url, thumbnail_url, album_id, views, reactions_count, comments_count, is_featured, created_at, updated_at',
      )
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(limit);
    type Row = Omit<ClubPostRow, 'author'>;
    const rows = (data as Row[] | null) ?? [];
    const profiles = await fetchProfilesByUserIds(client, rows.map((r) => r.author_id));
    return rows.map((r) => ({
      ...r,
      author: profiles.get(r.author_id) ?? null,
    }));
  },
);
