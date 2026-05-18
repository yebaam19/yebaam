import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import { cfImageUrl } from './cf';

/**
 * Canonical city-detail read.
 *
 * The lower-case `fetchCityBySlug(client, …)` accepts the Supabase client
 * directly so vitest can hit the real project anonymously without a Next.js
 * request context. The `cache()`-wrapped `getCityBySlug()` builds a session-
 * bound client from cookies and dedupes per request so multiple components
 * on the same page (cover, sidebar, grid) share one round-trip.
 *
 * Adjacent concerns live in sibling `*.server.ts` files — portal-data,
 * trending, discovery, followers, directory. Keep this file focused on the
 * one model the rest of the feature pivots around.
 */

export interface CityFacts {
  /** Most recent population estimate (from Wikidata P1082). */
  population: number | null;
  /** Elevation above sea level in meters (P2044). */
  altitudeM: number | null;
  /** Year the city was founded (P571, earliest claim). */
  foundedYear: number | null;
  /** Administrative region the city belongs to — department, state, province,
   *  etc. (P131) — already localized to Spanish at seed time. */
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

export const getCityBySlug = cache(async (slug: string): Promise<CityDetail | null> => {
  const client = await getServerClient();
  return fetchCityBySlug(client, slug);
});
