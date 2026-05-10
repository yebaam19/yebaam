import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import type {
  ClubLinkRow,
  ClubMemberRow,
  ClubPostRow,
  MusicAlbumRow,
  MusicArticleAuthor,
} from '../types/music.types';

type ProfileLite = {
  id: string;
  username: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_cloudflare_id: string | null;
};

/** Batch-load profile mini-objects for a set of user ids. Used because
 *  club_members / club_posts / music_articles all reference auth.users(id)
 *  directly — there is no FK to public.profiles, so PostgREST embeds fail. */
async function fetchProfilesByUserIds(
  client: SupabaseClient,
  userIds: string[],
): Promise<Map<string, MusicArticleAuthor>> {
  const map = new Map<string, MusicArticleAuthor>();
  if (!userIds.length) return map;
  const unique = Array.from(new Set(userIds));
  const { data } = await client
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, avatar_cloudflare_id')
    .in('id', unique);
  for (const p of ((data as ProfileLite[] | null) ?? [])) {
    const nameFromParts = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
    map.set(p.id, {
      id: p.id,
      username: p.username,
      full_name: p.display_name ?? (nameFromParts || null),
      avatar_cf_image_id: p.avatar_cloudflare_id,
    });
  }
  return map;
}

export { fetchProfilesByUserIds };

export interface MusicClubRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  music_genre: string;
  cover_image_url: string | null;
  profile_image_url: string | null;
  album_count: number;
  member_count: number;
}

/** Lookup of every genre-club + its album count + its member count.
 *  Ordered by album count desc so the densest clubs lead. `react.cache()` so
 *  the same render doesn't double-query. */
export const listMusicClubs = cache(async (): Promise<MusicClubRow[]> => {
  const client = await getServerClient();
  const { data: clubs, error } = await client
    .from('clubs')
    .select('id, name, slug, description, music_genre, cover_image_url, profile_image_url')
    .eq('category', 'MUSICA')
    .not('music_genre', 'is', null)
    .order('name', { ascending: true });
  if (error || !clubs) return [];
  type Row = {
    id: string;
    name: string;
    slug: string;
    description: string;
    music_genre: string;
    cover_image_url: string | null;
    profile_image_url: string | null;
  };
  const rows = clubs as Row[];

  const clubIds = rows.map((r) => r.id);
  if (clubIds.length === 0) return [];

  // Album + member counts in two batched queries; saves N+1.
  const [{ data: albumRows }, { data: memberRows }] = await Promise.all([
    client.from('music_album_clubs').select('club_id').in('club_id', clubIds),
    client.from('club_members').select('club_id').in('club_id', clubIds),
  ]);

  const albumCount = new Map<string, number>();
  for (const r of (albumRows ?? []) as Array<{ club_id: string }>) {
    albumCount.set(r.club_id, (albumCount.get(r.club_id) ?? 0) + 1);
  }
  const memberCount = new Map<string, number>();
  for (const r of (memberRows ?? []) as Array<{ club_id: string }>) {
    memberCount.set(r.club_id, (memberCount.get(r.club_id) ?? 0) + 1);
  }

  return rows
    .map((r) => ({
      ...r,
      album_count: albumCount.get(r.id) ?? 0,
      member_count: memberCount.get(r.id) ?? 0,
    }))
    .sort((a, b) => b.album_count - a.album_count || a.name.localeCompare(b.name));
});

export const getMusicClubBySlug = cache(async (slug: string): Promise<MusicClubRow | null> => {
  const client = await getServerClient();
  const { data: club } = await client
    .from('clubs')
    .select('id, name, slug, description, music_genre, cover_image_url, profile_image_url')
    .eq('category', 'MUSICA')
    .eq('slug', slug)
    .maybeSingle();
  if (!club) return null;
  const c = club as Omit<MusicClubRow, 'album_count' | 'member_count'>;

  const [{ count: albumCount }, { count: memberCount }] = await Promise.all([
    client
      .from('music_album_clubs')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', c.id),
    client
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', c.id),
  ]);

  return {
    ...c,
    album_count: albumCount ?? 0,
    member_count: memberCount ?? 0,
  };
});

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

/** Returns the current viewer's role in a club, or null if they aren't a member. */
export const getViewerRoleInClub = cache(async (clubId: string): Promise<string | null> => {
  const client = await getServerClient();
  const { data: u } = await client.auth.getUser();
  if (!u.user) return null;
  const { data } = await client
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', u.user.id)
    .maybeSingle();
  return (data as { role: string } | null)?.role ?? null;
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
