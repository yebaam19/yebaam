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
  country: { id: string; code: string | null; name: string } | null;
  state: { id: string; name: string } | null;
};

const CITY_SELECT = `id, name, slug, description, cover_cf_image_id, logo_cf_image_id,
  is_featured, follower_count, photo_count, video_count, post_count,
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
