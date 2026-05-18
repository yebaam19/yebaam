import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';

/**
 * Phase 5 directory category listings — businesses joined to one
 * `business_categories.slug` filtered by city.
 */

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
 * Two-step (resolve category id, then filter on city_id + category_id) instead
 * of a nested PostgREST join — the join syntax for filtering by a related
 * table's column is awkward, and the extra round-trip is dwarfed by the page
 * render anyway.
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
