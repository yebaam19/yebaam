import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import { fetchProfilesByUserIds } from './clubs.server';
import type {
  MusicArticleAuthor,
  MusicArticleRow,
  MusicArticleWithRefs,
} from '../types/music.types';

interface ListOpts {
  publishedOnly?: boolean;
  limit?: number;
  offset?: number;
}

type ArticleRow = MusicArticleRow & {
  music_article_artists:
    | Array<{
        artist_id: string;
        music_artists:
          | { id: string; name: string; slug: string }
          | Array<{ id: string; name: string; slug: string }>;
      }>
    | null;
};

type ArticleRowWithClub = ArticleRow & {
  clubs: { id: string; slug: string; name: string } | null;
};

/** Articles scoped to one club. By default returns published-only with newest
 *  first; pass `publishedOnly: false` for the admin list. */
export const listMusicArticles = cache(
  async (clubId: string, opts: ListOpts = {}): Promise<MusicArticleWithRefs[]> => {
    const { publishedOnly = true, limit = 50, offset = 0 } = opts;
    const client = await getServerClient();
    let q = client
      .from('music_articles')
      .select(
        '*, music_article_artists(artist_id, music_artists!inner(id, name, slug))',
      )
      .eq('club_id', clubId)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (publishedOnly) q = q.not('published_at', 'is', null);
    const { data } = await q;
    const rows = (data as ArticleRow[] | null) ?? [];
    const profiles = await fetchProfilesByUserIds(client, rows.map((r) => r.author_id));
    return rows.map((r) => mapArticle(r, null, profiles));
  },
);

/** Single article, joined with its tagged artists and club ref. Used by the
 *  detail page. */
export const getMusicArticleBySlug = cache(
  async (clubSlug: string, articleSlug: string): Promise<MusicArticleWithRefs | null> => {
    const client = await getServerClient();
    const { data: club } = await client
      .from('clubs')
      .select('id, slug, name')
      .eq('slug', clubSlug)
      .maybeSingle();
    if (!club) return null;
    const c = club as { id: string; slug: string; name: string };
    const { data } = await client
      .from('music_articles')
      .select(
        '*, music_article_artists(artist_id, music_artists!inner(id, name, slug))',
      )
      .eq('club_id', c.id)
      .eq('slug', articleSlug)
      .maybeSingle();
    if (!data) return null;
    const row = data as ArticleRow;
    const profiles = await fetchProfilesByUserIds(client, [row.author_id]);
    return mapArticle(row, { id: c.id, slug: c.slug, name: c.name }, profiles);
  },
);

/** Articles tagging this artist — drives the artist page "Artículos" section. */
export const listArticlesForArtist = cache(
  async (artistId: string): Promise<MusicArticleWithRefs[]> => {
    const client = await getServerClient();
    const { data: junctions } = await client
      .from('music_article_artists')
      .select('article_id')
      .eq('artist_id', artistId);
    const ids = ((junctions as Array<{ article_id: string }> | null) ?? []).map((r) => r.article_id);
    if (ids.length === 0) return [];
    const { data } = await client
      .from('music_articles')
      .select(
        '*, music_article_artists(artist_id, music_artists!inner(id, name, slug)), clubs(id, slug, name)',
      )
      .in('id', ids)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false, nullsFirst: false });
    const rows = (data as ArticleRowWithClub[] | null) ?? [];
    const profiles = await fetchProfilesByUserIds(client, rows.map((r) => r.author_id));
    return rows.map((r) => mapArticle(r, r.clubs ?? null, profiles));
  },
);

/** Articles tagging this label — drives the label page "Artículos" section. */
export const listArticlesForLabel = cache(
  async (labelId: string): Promise<MusicArticleWithRefs[]> => {
    const client = await getServerClient();
    const { data: junctions } = await client
      .from('music_article_labels')
      .select('article_id')
      .eq('label_id', labelId);
    const ids = ((junctions as Array<{ article_id: string }> | null) ?? []).map((r) => r.article_id);
    if (ids.length === 0) return [];
    const { data } = await client
      .from('music_articles')
      .select(
        '*, music_article_artists(artist_id, music_artists!inner(id, name, slug)), clubs(id, slug, name)',
      )
      .in('id', ids)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false, nullsFirst: false });
    const rows = (data as ArticleRowWithClub[] | null) ?? [];
    const profiles = await fetchProfilesByUserIds(client, rows.map((r) => r.author_id));
    return rows.map((r) => mapArticle(r, r.clubs ?? null, profiles));
  },
);

/** Clubs an artist appears in (via the album-club junction). */
export const listClubsForArtist = cache(
  async (artistId: string): Promise<Array<{ id: string; slug: string; name: string }>> => {
    const client = await getServerClient();
    const { data } = await client
      .from('music_albums')
      .select('id, music_album_clubs(club_id, clubs!inner(id, slug, name))')
      .eq('artist_id', artistId);
    type Row = {
      music_album_clubs:
        | Array<{ club_id: string; clubs: { id: string; slug: string; name: string } | Array<{ id: string; slug: string; name: string }> }>
        | null;
    };
    const seen = new Map<string, { id: string; slug: string; name: string }>();
    for (const a of ((data as unknown as Row[] | null) ?? [])) {
      for (const j of a.music_album_clubs ?? []) {
        const c = Array.isArray(j.clubs) ? j.clubs[0] : j.clubs;
        if (c && !seen.has(c.id)) seen.set(c.id, c);
      }
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  },
);

// ---------- internal ----------

function mapArticle(
  r: ArticleRow,
  club: { id: string; slug: string; name: string } | null,
  profiles: Map<string, MusicArticleAuthor>,
): MusicArticleWithRefs {
  return {
    id: r.id,
    club_id: r.club_id,
    author_id: r.author_id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    content: r.content,
    summary: r.summary,
    cf_image_id: r.cf_image_id,
    tags: r.tags,
    published_at: r.published_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
    author: profiles.get(r.author_id) ?? null,
    artists: (r.music_article_artists ?? [])
      .map((x) => (Array.isArray(x.music_artists) ? x.music_artists[0] : x.music_artists))
      .filter((x): x is { id: string; name: string; slug: string } => Boolean(x)),
    club,
  };
}
