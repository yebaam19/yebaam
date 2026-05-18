import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import type { CityBasic } from '../interfaces/city.interfaces';
import type { GlobalStats } from '../interfaces/global-stats.interface';

/**
 * RSC-friendly server functions for the Cities Portal list page.
 *
 * The exported `cache()`-wrapped helpers (`getCities`, `getGlobalStats`,
 * `getCountriesWithCities`) read cookies via `next/headers` and are only
 * safe inside a request context. The lower-case `fetch*` helpers accept
 * a Supabase client directly so they can be unit-tested from vitest's
 * node environment with the anon publishable key — and so the same code
 * path serves both production reads and tests.
 */

const CF_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';

function cfImageUrl(id: string | null): string | undefined {
  if (!id) return undefined;
  if (!CF_ACCOUNT_HASH) return undefined;
  return `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${id}/public`;
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

function toCityDto(row: CityRow): CityBasic & { country: CityBasic['country'] & { code?: string } } {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    coverImageUrl: cfImageUrl(row.cover_cf_image_id),
    logoUrl: cfImageUrl(row.logo_cf_image_id),
    country: {
      id: row.country?.id ?? '',
      name: row.country?.name ?? '',
      code: row.country?.code ?? undefined,
    },
    state: row.state
      ? {
          id: row.state.id,
          name: row.state.name,
        }
      : undefined,
    stats: {
      followerCount: row.follower_count ?? 0,
      photoCount: row.photo_count ?? 0,
      videoCount: row.video_count ?? 0,
      postCount: row.post_count ?? 0,
    },
    isFollowing: false,
    isFeatured: Boolean(row.is_featured),
  };
}

const CITY_SELECT = `id, name, slug, description, cover_cf_image_id, logo_cf_image_id,
  is_featured, follower_count, photo_count, video_count, post_count,
  country:countries!inner(id, code, name),
  state:states(id, name)`;

export interface CitiesQueryOpts {
  q?: string;
  countryCode?: string;
}

/**
 * Pure read function — takes a Supabase client so it can be tested without a
 * request context (the cached wrapper below constructs one from cookies).
 */
export async function fetchCities(
  client: SupabaseClient,
  opts: CitiesQueryOpts = {},
): Promise<CityBasic[]> {
  let q = client
    .from('cities')
    .select(CITY_SELECT)
    .order('is_featured', { ascending: false })
    .order('follower_count', { ascending: false })
    .order('name', { ascending: true });

  if (opts.q && opts.q.trim()) {
    q = q.ilike('name', `%${opts.q.trim()}%`);
  }
  if (opts.countryCode && opts.countryCode.trim()) {
    // With `!inner` on the embedded select above, equality on the alias
    // restricts parent rows. Without it, the eq would silently keep
    // all parent rows and just null out the embed.
    q = q.eq('country.code', opts.countryCode.trim());
  }

  const { data, error } = await q;
  if (error) {
    console.error('[fetchCities]', error);
    return [];
  }
  return (data ?? []).map((row) => toCityDto(row as unknown as CityRow));
}

export async function fetchGlobalStats(client: SupabaseClient): Promise<GlobalStats> {
  const [cities, users, photos, videos] = await Promise.all([
    client.from('cities').select('id', { count: 'exact', head: true }),
    client.from('profiles').select('id', { count: 'exact', head: true }),
    client.from('profile_photos').select('id', { count: 'exact', head: true }),
    client.from('profile_videos').select('id', { count: 'exact', head: true }),
  ]);

  const totalPhotos = photos.count ?? 0;
  const totalVideos = videos.count ?? 0;

  return {
    totalCities: cities.count ?? 0,
    totalUsers: users.count ?? 0,
    totalPhotos,
    totalVideos,
    totalMedia: totalPhotos + totalVideos,
    totalPosts: 0,
    totalBusinesses: 0,
    totalServices: 0,
    totalDirectoryEntries: 0,
  };
}

export interface CountryOption {
  id: string;
  code: string;
  name: string;
}

export async function fetchCountriesWithCities(
  client: SupabaseClient,
): Promise<CountryOption[]> {
  // Pull `cities(id)` so PostgREST inner-joins and only returns countries
  // that have at least one city. The id is discarded post-fetch.
  const { data, error } = await client
    .from('countries')
    .select('id, code, name, cities!inner(id)')
    .order('name', { ascending: true });
  if (error) {
    console.error('[fetchCountriesWithCities]', error);
    return [];
  }
  const seen = new Set<string>();
  const out: CountryOption[] = [];
  for (const row of (data ?? []) as Array<{ id: string; code: string | null; name: string }>) {
    if (!row.code || seen.has(row.id)) continue;
    seen.add(row.id);
    out.push({ id: row.id, code: row.code, name: row.name });
  }
  return out;
}

// Cached request-scoped wrappers — only safe inside an RSC / Server Action.

export const getCities = cache(async (opts: CitiesQueryOpts = {}): Promise<CityBasic[]> => {
  const client = await getServerClient();
  return fetchCities(client, opts);
});

export const getGlobalStats = cache(async (): Promise<GlobalStats> => {
  const client = await getServerClient();
  return fetchGlobalStats(client);
});

export const getCountriesWithCities = cache(async (): Promise<CountryOption[]> => {
  const client = await getServerClient();
  return fetchCountriesWithCities(client);
});

/**
 * Returns the single most prominent featured city (or, if no city is flagged
 * `is_featured`, the city with the highest follower count). Used by the
 * `/cities` hero to back its full-bleed background image. Tiny SELECT
 * (id + name + cover only) so this is essentially free.
 */
export async function fetchFeaturedHeroCity(
  client: SupabaseClient,
): Promise<{ name: string; coverImageUrl?: string } | null> {
  const { data, error } = await client
    .from('cities')
    .select('name, cover_cf_image_id')
    .order('is_featured', { ascending: false })
    .order('follower_count', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[fetchFeaturedHeroCity]', error);
    return null;
  }
  if (!data) return null;
  return {
    name: (data as { name: string }).name,
    coverImageUrl: cfImageUrl((data as { cover_cf_image_id: string | null }).cover_cf_image_id),
  };
}

export const getFeaturedHeroCity = cache(async () => {
  const client = await getServerClient();
  return fetchFeaturedHeroCity(client);
});
