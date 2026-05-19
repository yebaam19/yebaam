import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';

/**
 * Aggregated tile-count payload for the City Portal grid. One round-trip per
 * city detail render, dedup'd via React.cache().
 */
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
 * clubs, blogs, forums) did not always have a `city_id` column. Wrapping each
 * query in `safeCount` keeps the rest of the round-trip alive when one table
 * is missing the filter column or RLS denies the read.
 *
 * The task is typed as a thenable rather than a Promise so supabase-js query
 * builders (which implement `.then` but are not Promises) satisfy the
 * signature without an extra `await Promise.resolve(...)` dance.
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

/**
 * Count rows of one table that match a city id, optionally narrowed by a
 * single status-like equality filter. Collapses the 10 near-identical Supabase
 * count queries the portal-data fetcher used to inline. `head: true` skips
 * row hydration — we only need the count.
 */
/**
 * Forums aren't anchored by `city_id` — they hang off `forum_categories`,
 * which hangs off the city's `forum_spaces` row (owner_type='city',
 * owner_id=cityId). This helper walks that join.
 */
async function countCityForums(
  client: SupabaseClient,
  cityId: string,
): Promise<number> {
  return safeCount(() =>
    client
      .from('forums')
      .select('id, forum_categories!inner(space_id, forum_spaces!inner(owner_type, owner_id))', {
        count: 'exact',
        head: true,
      })
      .eq('forum_categories.forum_spaces.owner_type', 'city')
      .eq('forum_categories.forum_spaces.owner_id', cityId),
  )
}

async function countCityRows(
  client: SupabaseClient,
  table: string,
  cityId: string,
  filter?: { column: string; value: string },
): Promise<number> {
  return safeCount(() => {
    const q = client
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('city_id', cityId);
    return filter ? q.eq(filter.column, filter.value) : q;
  });
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
    countCityRows(client, 'city_news', cityId, { column: 'status', value: 'approved' }),
    countCityRows(client, 'city_promotions', cityId, { column: 'status', value: 'active' }),
    countCityRows(client, 'city_classifieds', cityId, { column: 'status', value: 'open' }),
    countCityRows(client, 'city_social_help', cityId, { column: 'status', value: 'open' }),
    countCityRows(client, 'city_places', cityId),
    countCityRows(client, 'businesses', cityId),
    countCityRows(client, 'communities', cityId),
    countCityRows(client, 'clubs', cityId),
    countCityRows(client, 'blogs', cityId),
    countCityForums(client, cityId),
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

export const getCityPortalData = cache(async (cityId: string): Promise<CityPortalData> => {
  const client = await getServerClient();
  return fetchCityPortalData(client, cityId);
});
