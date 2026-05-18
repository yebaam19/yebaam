import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';

/**
 * RSC-friendly read functions for the City Portal detail page.
 *
 * The lower-case `fetchX(client, …)` helpers accept the Supabase client
 * directly so vitest can hit the real project anonymously without a Next.js
 * request context. The `cache()`-wrapped `getX()` wrappers build a session-
 * bound client from cookies and dedupe per request so the cover, the grid,
 * and the Suspense-streamed tile counts share one round-trip apiece.
 */

const CF_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';

function cfImageUrl(id: string | null): string | undefined {
  if (!id) return undefined;
  if (!CF_ACCOUNT_HASH) return undefined;
  return `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${id}/public`;
}

export interface CityFacts {
  /** Most recent population estimate (from Wikidata P1082). */
  population: number | null;
  /** Elevation above sea level in meters (P2044). */
  altitudeM: number | null;
  /** Year the city was founded (P571, earliest claim). */
  foundedYear: number | null;
  /** Administrative region the city belongs to — department, state,
   *  province, etc. (P131) — already localized to Spanish at seed time. */
  department: string | null;
}

export interface CityDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImageUrl?: string;
  logoUrl?: string;
  coverCfImageId: string | null;
  state?: { id: string; name: string };
  country: { id: string; code: string; name: string };
  isFeatured: boolean;
  facts: CityFacts;
  stats: {
    followerCount: number;
    photoCount: number;
    videoCount: number;
    postCount: number;
  };
}

type CityRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_cf_image_id: string | null;
  logo_cf_image_id: string | null;
  is_featured: boolean | null;
  follower_count: number | null;
  photo_count: number | null;
  video_count: number | null;
  post_count: number | null;
  population: number | null;
  altitude_m: number | null;
  founded_year: number | null;
  department: string | null;
  country: { id: string; code: string | null; name: string } | null;
  state: { id: string; name: string } | null;
};

const CITY_SELECT = `id, name, slug, description, cover_cf_image_id, logo_cf_image_id,
  is_featured, follower_count, photo_count, video_count, post_count,
  population, altitude_m, founded_year, department,
  country:countries!inner(id, code, name),
  state:states(id, name)`;

function toDetail(row: CityRow): CityDetail {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    coverImageUrl: cfImageUrl(row.cover_cf_image_id),
    logoUrl: cfImageUrl(row.logo_cf_image_id),
    coverCfImageId: row.cover_cf_image_id,
    state: row.state ? { id: row.state.id, name: row.state.name } : undefined,
    country: {
      id: row.country?.id ?? '',
      code: row.country?.code ?? '',
      name: row.country?.name ?? '',
    },
    isFeatured: Boolean(row.is_featured),
    facts: {
      population: row.population,
      altitudeM: row.altitude_m,
      foundedYear: row.founded_year,
      department: row.department,
    },
    stats: {
      followerCount: row.follower_count ?? 0,
      photoCount: row.photo_count ?? 0,
      videoCount: row.video_count ?? 0,
      postCount: row.post_count ?? 0,
    },
  };
}

export async function fetchCityBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<CityDetail | null> {
  const { data, error } = await client
    .from('cities')
    .select(CITY_SELECT)
    .eq('slug', slug)
    .maybeSingle();
  if (error) {
    console.error('[fetchCityBySlug]', error);
    return null;
  }
  if (!data) return null;
  return toDetail(data as unknown as CityRow);
}

export interface CityPortalData {
  newsCount: number;
  promotionCount: number;
  classifiedCount: number;
  socialHelpCount: number;
  placeCount: number;
  businessCount: number;
  communityCount: number;
  clubCount: number;
  blogCount: number;
  forumCount: number;
}

/**
 * Resilient single-count helper. Some tables referenced here (communities,
 * clubs, blogs, forums) do not yet have a `city_id` column — Phase 5 adds it.
 * Wrapping each query in `safeCount` keeps the rest of the round-trip alive
 * when one table is missing the filter column or RLS denies the read.
 *
 * The task is typed as a thenable rather than a Promise so supabase-js
 * query builders (which implement `.then` but are not Promises) satisfy
 * the signature without an extra `await Promise.resolve(...)` dance.
 */
type CountResult = { count: number | null; error: unknown };
type CountThenable = PromiseLike<CountResult>;

async function safeCount(task: () => CountThenable): Promise<number> {
  try {
    const { count, error } = await task();
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function fetchCityPortalData(
  client: SupabaseClient,
  cityId: string,
): Promise<CityPortalData> {
  const [
    newsCount,
    promotionCount,
    classifiedCount,
    socialHelpCount,
    placeCount,
    businessCount,
    communityCount,
    clubCount,
    blogCount,
    forumCount,
  ] = await Promise.all([
    safeCount(() =>
      client
        .from('city_news')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', cityId)
        .eq('status', 'approved'),
    ),
    safeCount(() =>
      client
        .from('city_promotions')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', cityId)
        .eq('status', 'active'),
    ),
    safeCount(() =>
      client
        .from('city_classifieds')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', cityId)
        .eq('status', 'open'),
    ),
    safeCount(() =>
      client
        .from('city_social_help')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', cityId)
        .eq('status', 'open'),
    ),
    safeCount(() =>
      client
        .from('city_places')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', cityId),
    ),
    safeCount(() =>
      client
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', cityId),
    ),
    // The next four tables do not yet carry a `city_id` filter — Phase 5
    // adds it. The query intentionally targets the absent column so it
    // fails closed (count=0) rather than returning a global count.
    safeCount(() =>
      client
        .from('communities')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', cityId),
    ),
    safeCount(() =>
      client
        .from('clubs')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', cityId),
    ),
    safeCount(() =>
      client
        .from('blogs')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', cityId),
    ),
    safeCount(() =>
      client
        .from('forums')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', cityId),
    ),
  ]);

  return {
    newsCount,
    promotionCount,
    classifiedCount,
    socialHelpCount,
    placeCount,
    businessCount,
    communityCount,
    clubCount,
    blogCount,
    forumCount,
  };
}

export interface CityTrendingItem {
  id: string;
  title: string;
  coverImageUrl?: string;
  publishedAt: string;
}

/**
 * Top approved city news items, newest first. Powers the "En tendencia"
 * sidebar on the city detail page. We don't paginate here — three rows is
 * plenty for the rail; the full list lives at `/cities/[slug]/news`.
 */
export async function fetchCityTrending(
  client: SupabaseClient,
  cityId: string,
  limit = 3,
): Promise<CityTrendingItem[]> {
  const { data, error } = await client
    .from('city_news')
    .select('id, title, cover_cf_image_id, published_at')
    .eq('city_id', cityId)
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[fetchCityTrending]', error);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as { id: string; title: string; cover_cf_image_id: string | null; published_at: string | null };
    return {
      id: r.id,
      title: r.title,
      coverImageUrl: cfImageUrl(r.cover_cf_image_id),
      publishedAt: r.published_at ?? new Date(0).toISOString(),
    };
  });
}

export type DiscoveryThumbnails = Record<string, string | undefined>;

/**
 * Shared CF image ids for the discovery tile grid, keyed by category id.
 * Returned as a plain map so the React tree doesn't need to know about
 * the underlying table. One row per category, hit once per request.
 */
export async function fetchDiscoveryThumbnails(
  client: SupabaseClient,
): Promise<DiscoveryThumbnails> {
  const { data, error } = await client
    .from('discovery_thumbnails')
    .select('category, cf_image_id');
  if (error) {
    console.error('[fetchDiscoveryThumbnails]', error);
    return {};
  }
  const out: DiscoveryThumbnails = {};
  for (const row of (data ?? []) as Array<{ category: string; cf_image_id: string }>) {
    out[row.category] = cfImageUrl(row.cf_image_id);
  }
  return out;
}

export async function fetchIsFollowing(
  client: SupabaseClient,
  cityId: string,
  userId: string | null,
): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await client
    .from('city_followers')
    .select('city_id')
    .eq('city_id', cityId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[fetchIsFollowing]', error);
    return false;
  }
  return !!data;
}

// ---------------------------------------------------------------------------
// Cached request-scoped wrappers — only safe inside an RSC / Server Action.
// ---------------------------------------------------------------------------

export const getCityBySlug = cache(async (slug: string): Promise<CityDetail | null> => {
  const client = await getServerClient();
  return fetchCityBySlug(client, slug);
});

export const getCityPortalData = cache(async (cityId: string): Promise<CityPortalData> => {
  const client = await getServerClient();
  return fetchCityPortalData(client, cityId);
});

export const getIsFollowing = cache(
  async (cityId: string, userId: string | null): Promise<boolean> => {
    const client = await getServerClient();
    return fetchIsFollowing(client, cityId, userId);
  },
);

export const getCityTrending = cache(
  async (cityId: string, limit = 3): Promise<CityTrendingItem[]> => {
    const client = await getServerClient();
    return fetchCityTrending(client, cityId, limit);
  },
);

export const getDiscoveryThumbnails = cache(async (): Promise<DiscoveryThumbnails> => {
  const client = await getServerClient();
  return fetchDiscoveryThumbnails(client);
});

// ---------------------------------------------------------------------------
// Directory category listings — Phase 5
// ---------------------------------------------------------------------------

export interface CityBusinessListing {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  adImageUrl?: string;
  address?: string;
  website?: string;
  phone?: string;
  averageRating: number | null;
}

type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  ad_image_url: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  average_rating: string | number | null;
};

function toListing(row: BusinessRow): CityBusinessListing {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    logoUrl: row.logo_url ?? undefined,
    coverUrl: row.cover_url ?? undefined,
    adImageUrl: row.ad_image_url ?? undefined,
    address: row.address ?? undefined,
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    averageRating: row.average_rating === null ? null : Number(row.average_rating),
  };
}

/**
 * Resolve a `business_categories.slug` to its row id. Cheap one-shot lookup —
 * the table is small (10 portal directory rows + any legacy ones) and the
 * result rarely changes, so React.cache() per-request dedupe is sufficient.
 */
export async function fetchBusinessCategoryIdBySlug(
  client: SupabaseClient,
  categorySlug: string,
): Promise<string | null> {
  const { data, error } = await client
    .from('business_categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle();
  if (error) {
    console.error('[fetchBusinessCategoryIdBySlug]', error);
    return null;
  }
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * Active public businesses for one city + one directory category slug.
 *
 * The query is intentionally two steps (resolve category id, then filter on
 * city_id + category_id) instead of a nested PostgREST join — the join syntax
 * for filtering by a related table's column is awkward, and the extra
 * round-trip is dwarfed by the page render anyway.
 *
 * The `visibility='PUBLIC'` filter is deliberately NOT set here: the
 * `businesses_select` RLS policy already restricts SELECT to public rows (or
 * the owner's own rows), so an explicit filter would be redundant and
 * misleading. `status='ACTIVE'` is kept since it is a moderation state
 * separate from visibility and not enforced by RLS.
 */
export async function fetchCityBusinessesByCategory(
  client: SupabaseClient,
  cityId: string,
  categorySlug: string,
): Promise<CityBusinessListing[]> {
  const categoryId = await fetchBusinessCategoryIdBySlug(client, categorySlug);
  if (!categoryId) return [];

  const { data, error } = await client
    .from('businesses')
    .select(
      'id, slug, name, description, logo_url, cover_url, ad_image_url, address, website, phone, average_rating',
    )
    .eq('city_id', cityId)
    .eq('category_id', categoryId)
    .eq('status', 'ACTIVE')
    .order('name', { ascending: true });
  if (error) {
    console.error('[fetchCityBusinessesByCategory]', error);
    return [];
  }
  return (data ?? []).map((row) => toListing(row as BusinessRow));
}

export const getCityBusinessesByCategory = cache(
  async (cityId: string, categorySlug: string): Promise<CityBusinessListing[]> => {
    const client = await getServerClient();
    return fetchCityBusinessesByCategory(client, cityId, categorySlug);
  },
);
