'use server';

import { getServiceClient } from '@/utils/supabase/server';
import { adminGate, type ActionResult } from './_shared';

export interface MusicArchiveStats {
  totals: {
    profiles: number;       // total registered users
    music_clubs: number;
    music_artists: number;
    music_albums: number;
    music_tracks: number;
    music_media: number;
    for_trade_albums: number;
  };
  /** Albums grouped by genre (via music_album_clubs primary tag). */
  albumsByGenre: Array<{
    genre_id: string;
    genre_slug: string;
    genre_name: string;
    album_count: number;
    member_count: number;
  }>;
  /** Top music clubs ranked by a simple composite (members + posts + articles). */
  topClubs: Array<{
    club_id: string;
    club_name: string;
    club_slug: string;
    genre_name: string;
    member_count: number;
    post_count: number;
    article_count: number;
    score: number;
  }>;
}

/** Aggregated counts for the admin "Estadísticas" tab. Platform-admin only.
 *  Uses HEAD counts where possible to avoid pulling rows back. */
export async function getMusicArchiveStats(): Promise<ActionResult<MusicArchiveStats>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();

  // 7 top-level totals in parallel.
  const [profiles, mClubs, artists, albums, tracks, media, forTrade] = await Promise.all([
    svc.from('profiles').select('id', { count: 'exact', head: true }),
    svc
      .from('clubs')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'MUSICA')
      .not('music_genre_id', 'is', null),
    svc.from('music_artists').select('id', { count: 'exact', head: true }),
    svc.from('music_albums').select('id', { count: 'exact', head: true }),
    svc.from('music_tracks').select('id', { count: 'exact', head: true }),
    svc.from('music_media').select('id', { count: 'exact', head: true }),
    svc.from('music_albums').select('id', { count: 'exact', head: true }).eq('for_trade', true),
  ]);

  // Genres + clubs (id, music_genre_id) so we can aggregate album/member
  // counts by genre via the existing music_album_clubs pivot.
  const [genresRes, musicClubsRes, allPivots, allMembers] = await Promise.all([
    svc.from('music_genres').select('id, slug, name').order('sort_order', { ascending: true }),
    svc
      .from('clubs')
      .select('id, name, slug, music_genre_id')
      .eq('category', 'MUSICA')
      .not('music_genre_id', 'is', null),
    svc.from('music_album_clubs').select('club_id, is_primary'),
    svc.from('club_members').select('club_id, status'),
  ]);

  type Genre = { id: string; slug: string; name: string };
  type Club = { id: string; name: string; slug: string; music_genre_id: string };
  const genres = (genresRes.data ?? []) as Genre[];
  const clubs = (musicClubsRes.data ?? []) as Club[];
  const pivots = (allPivots.data ?? []) as Array<{ club_id: string; is_primary: boolean }>;
  const members = (allMembers.data ?? []) as Array<{ club_id: string; status: string }>;

  const clubById = new Map<string, Club>();
  for (const c of clubs) clubById.set(c.id, c);

  const genreById = new Map<string, Genre>();
  for (const g of genres) genreById.set(g.id, g);

  // Album count per genre — only "primary" assignments to avoid double-counting.
  const albumCountByGenre = new Map<string, number>();
  for (const p of pivots) {
    if (!p.is_primary) continue;
    const club = clubById.get(p.club_id);
    if (!club) continue;
    albumCountByGenre.set(
      club.music_genre_id,
      (albumCountByGenre.get(club.music_genre_id) ?? 0) + 1,
    );
  }

  // Member count per club, then aggregate to genre.
  const memberByClub = new Map<string, number>();
  for (const m of members) {
    if (m.status !== 'approved') continue;
    memberByClub.set(m.club_id, (memberByClub.get(m.club_id) ?? 0) + 1);
  }
  const memberCountByGenre = new Map<string, number>();
  for (const c of clubs) {
    memberCountByGenre.set(
      c.music_genre_id,
      (memberCountByGenre.get(c.music_genre_id) ?? 0) + (memberByClub.get(c.id) ?? 0),
    );
  }

  const albumsByGenre = genres
    .map((g) => ({
      genre_id: g.id,
      genre_slug: g.slug,
      genre_name: g.name,
      album_count: albumCountByGenre.get(g.id) ?? 0,
      member_count: memberCountByGenre.get(g.id) ?? 0,
    }))
    .sort((a, b) => b.album_count - a.album_count || b.member_count - a.member_count);

  // Top clubs by composite score = members + 0.5*posts + 0.5*articles. Pull
  // posts + articles counts per club in two batched queries.
  const clubIds = clubs.map((c) => c.id);
  const [postsRes, articlesRes] = await Promise.all([
    clubIds.length > 0
      ? svc.from('club_posts').select('club_id').in('club_id', clubIds)
      : Promise.resolve({ data: [] as Array<{ club_id: string }> }),
    clubIds.length > 0
      ? svc.from('music_articles').select('club_id').in('club_id', clubIds)
      : Promise.resolve({ data: [] as Array<{ club_id: string | null }> }),
  ]);
  const postsByClub = new Map<string, number>();
  for (const p of (postsRes.data ?? []) as Array<{ club_id: string }>) {
    postsByClub.set(p.club_id, (postsByClub.get(p.club_id) ?? 0) + 1);
  }
  const articlesByClub = new Map<string, number>();
  for (const a of (articlesRes.data ?? []) as Array<{ club_id: string | null }>) {
    if (a.club_id) articlesByClub.set(a.club_id, (articlesByClub.get(a.club_id) ?? 0) + 1);
  }

  const topClubs = clubs
    .map((c) => {
      const m = memberByClub.get(c.id) ?? 0;
      const p = postsByClub.get(c.id) ?? 0;
      const a = articlesByClub.get(c.id) ?? 0;
      return {
        club_id: c.id,
        club_name: c.name,
        club_slug: c.slug,
        genre_name: genreById.get(c.music_genre_id)?.name ?? '—',
        member_count: m,
        post_count: p,
        article_count: a,
        score: m + p * 0.5 + a * 0.5,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    ok: true,
    data: {
      totals: {
        profiles: profiles.count ?? 0,
        music_clubs: mClubs.count ?? 0,
        music_artists: artists.count ?? 0,
        music_albums: albums.count ?? 0,
        music_tracks: tracks.count ?? 0,
        music_media: media.count ?? 0,
        for_trade_albums: forTrade.count ?? 0,
      },
      albumsByGenre,
      topClubs,
    },
  };
}
