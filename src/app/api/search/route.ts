import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { loadPageContext, mapPage, type PageRow } from '@/lib/api/pages';

/**
 * Aggregated search (PDF §12) — pages, posts, page articles, events, auditions.
 * Facet via `?type=` (all|pages|posts|articles|events|auditions).
 *
 * Consumed by `useSearch` (src/features/search/hooks/useSearch.ts) which powers
 * the global /search page. People search stays on /api/search/users.
 */
const SEARCH_FACETS = ['all', 'pages', 'posts', 'articles', 'events', 'auditions'] as const;
type SearchFacet = (typeof SEARCH_FACETS)[number];

function isSearchFacet(value: string): value is SearchFacet {
  return (SEARCH_FACETS as readonly string[]).includes(value);
}

type PostRow = {
  id: string;
  content: string | null;
  created_at: string;
  page_id: string | null;
  author_id: string | null;
};
type ArticleRow = {
  id: string;
  title: string;
  description: string | null;
  page_id: string;
  published_at: string | null;
};
type EventRow = { id: string; title: string; place: string | null; starts_at: string; page_id: string };
type AuditionRow = {
  id: string;
  title: string;
  city: string | null;
  starts_at: string | null;
  page_id: string;
};

/** Summary of the owning page, attached to child rows so the UI can link to /feed/paginas/[slug]. */
type PageRef = { id: string; slug: string; name: string; profile_image_url: string | null };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  const type = (searchParams.get('type') ?? 'all').toLowerCase();
  const category = searchParams.get('category')?.trim() || null;
  const city = searchParams.get('city')?.trim() || null;
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '20') || 20, 1), 50);

  if (!isSearchFacet(type)) {
    return NextResponse.json(
      { error: `Unknown type "${type}". Expected one of: ${SEARCH_FACETS.join(', ')}.` },
      { status: 400 }
    );
  }

  if (q.length < 2) {
    return NextResponse.json({
      pages: [],
      posts: [],
      articles: [],
      events: [],
      auditions: [],
    });
  }

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;

  // `%` and `_` are LIKE wildcards and `\` is the escape char — escape them so
  // a query like "100%" matches the literal text instead of everything.
  const escaped = q.replace(/[\\%_]/g, '\\$&');
  const pattern = `%${escaped}%`;

  const want = (t: SearchFacet) => type === 'all' || type === t;

  const [pagesRes, postsRes, articlesRes, eventsRes, auditionsRes] = await Promise.all([
    want('pages')
      ? (() => {
          let query = client
            .from('pages')
            .select('*')
            .eq('privacy', 'public')
            .ilike('name', pattern)
            .order('follower_count', { ascending: false })
            .limit(limit);
          if (category) query = query.eq('category', category);
          return query;
        })()
      : Promise.resolve({ data: [] as PageRow[], error: null }),
    want('posts')
      ? client
          .from('posts')
          .select('id,content,created_at,page_id,author_id')
          .ilike('content', pattern)
          .not('page_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [] as PostRow[], error: null }),
    want('articles')
      ? client
          .from('page_articles')
          .select('id,title,description,page_id,published_at')
          .not('published_at', 'is', null)
          .ilike('title', pattern)
          .order('published_at', { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [] as ArticleRow[], error: null }),
    want('events')
      ? client
          .from('page_events')
          .select('id,title,place,starts_at,page_id')
          .ilike('title', pattern)
          .order('starts_at', { ascending: true })
          .limit(limit)
      : Promise.resolve({ data: [] as EventRow[], error: null }),
    want('auditions')
      ? client
          .from('page_auditions')
          .select('id,title,city,starts_at,page_id')
          .ilike('title', pattern)
          .order('starts_at', { ascending: true })
          .limit(limit)
      : Promise.resolve({ data: [] as AuditionRow[], error: null }),
  ]);

  // A failed facet degrades to an empty list so the rest of the response still
  // works, but the failure must be observable in the server logs.
  const facetErrors: Array<[SearchFacet, unknown]> = [
    ['pages', pagesRes.error],
    ['posts', postsRes.error],
    ['articles', articlesRes.error],
    ['events', eventsRes.error],
    ['auditions', auditionsRes.error],
  ];
  for (const [facet, error] of facetErrors) {
    if (error) console.error(`[api/search] facet "${facet}" failed:`, error);
  }

  let pageRows = (pagesRes.data ?? []) as PageRow[];
  if (city) {
    // Honest filter: a city that matches nothing returns zero pages.
    // Caveat: it runs AFTER the DB `limit`, so it only sees the first `limit`
    // name matches by follower count — pages in that city ranked beyond the
    // window are not recovered. Moving the filter into SQL needs a queryable
    // city column (contact is jsonb); acceptable until then.
    const cityLc = city.toLowerCase();
    pageRows = pageRows.filter((r) => {
      const c = (r.contact as { address?: { city?: string } } | null)?.address?.city;
      return typeof c === 'string' && c.toLowerCase().includes(cityLc);
    });
  }

  const posts = (postsRes.data ?? []) as PostRow[];
  const articles = (articlesRes.data ?? []) as ArticleRow[];
  const events = (eventsRes.data ?? []) as EventRow[];
  const auditions = (auditionsRes.data ?? []) as AuditionRow[];

  // Child rows only carry page_id; resolve slug/name once so the client can
  // build /feed/paginas/[slug] links without N extra requests. Pages the
  // viewer cannot see simply don't resolve (page: null).
  const refIds = Array.from(
    new Set(
      [...posts, ...articles, ...events, ...auditions]
        .map((r) => r.page_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const pageRefs = new Map<string, PageRef>();
  if (refIds.length) {
    const { data: refRows, error: refError } = await client
      .from('pages')
      .select('id,slug,name,profile_image_url')
      .in('id', refIds);
    if (refError) console.error('[api/search] page refs lookup failed:', refError);
    for (const p of (refRows ?? []) as PageRef[]) pageRefs.set(p.id, p);
  }
  const withPage = <T extends { page_id: string | null }>(rows: T[]) =>
    rows.map((r) => ({ ...r, page: r.page_id ? (pageRefs.get(r.page_id) ?? null) : null }));

  const ctx = await loadPageContext(client, pageRows, viewerId);

  return NextResponse.json({
    pages: pageRows.map((r) => mapPage(r, ctx)),
    posts: withPage(posts),
    articles: withPage(articles),
    events: withPage(events),
    auditions: withPage(auditions),
  });
}
