import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import { cfImageUrl } from './cf';
import {
  SERVICE_CATEGORIES,
  findCategoryById,
} from '@/features/professional-services/data/service-categories-taxonomy';
import type {
  BusinessBasic,
  BusinessCategory,
  ProfessionalServiceBasic,
  ProfessionalServiceCategory,
} from '../interfaces/directory.interfaces';

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

// ============================================================================
// City directory landing — every active business / service for one city,
// shaped for the BusinessList / ServiceList client components (which group by
// `category.id` and render `category.name`). Backs /directory/businesses and
// /directory/services.
// ============================================================================

type CityBusinessRow = {
  id: string;
  slug: string;
  name: string;
  ad_image_url: string | null;
  category: { id: string; name: string } | { id: string; name: string }[] | null;
};

/**
 * All active businesses for a city, mapped to the directory list shape. The
 * `businesses` table has no social-link columns, so those stay undefined; the
 * embed is `!inner` so uncategorized rows (which can't be grouped) are dropped.
 */
export async function fetchCityBusinesses(
  client: SupabaseClient,
  cityId: string,
): Promise<BusinessBasic[]> {
  const { data, error } = await client
    .from('businesses')
    .select('id, slug, name, ad_image_url, category:business_categories!inner(id, name)')
    .eq('city_id', cityId)
    .eq('status', 'ACTIVE')
    .order('name', { ascending: true });
  if (error) {
    console.error('[fetchCityBusinesses]', error);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as CityBusinessRow;
    const cat = Array.isArray(r.category) ? r.category[0] : r.category;
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      adImageUrl: r.ad_image_url ?? undefined,
      category: { id: cat?.id ?? '', name: cat?.name ?? '' },
      _count: { reviews: 0, media: 0 },
    } satisfies BusinessBasic;
  });
}

export const getCityBusinesses = cache(async (cityId: string): Promise<BusinessBasic[]> => {
  const client = await getServerClient();
  return fetchCityBusinesses(client, cityId);
});

/** Portal directory business categories (real `business_categories` rows) —
 *  the grouping/filter axis for BusinessList. */
export const getBusinessDirectoryCategories = cache(async (): Promise<BusinessCategory[]> => {
  const client = await getServerClient();
  const { data, error } = await client
    .from('business_categories')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) {
    console.error('[getBusinessDirectoryCategories]', error);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as { id: string; name: string };
    return { id: r.id, name: r.name, createdAt: '' };
  });
});

type CityServiceRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ad_cf_image_id: string | null;
  cover_cf_image_id: string | null;
  logo_cf_image_id: string | null;
  address: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  hourly_rate: number | null;
  currency: string;
  available_for_hire: boolean;
  category_id: string | null;
  review_count: number;
  media_count: number;
};

/**
 * All active public `professional_services` for a city, mapped to the directory
 * list shape. Category name resolves via the static taxonomy; rows whose
 * category can't be resolved are dropped (ServiceList groups by category).
 * Cloudflare image ids are rebuilt at read time via `cfImageUrl`.
 */
export async function fetchCityServices(
  client: SupabaseClient,
  cityId: string,
): Promise<ProfessionalServiceBasic[]> {
  const { data, error } = await client
    .from('professional_services')
    .select(
      'id, slug, name, description, ad_cf_image_id, cover_cf_image_id, logo_cf_image_id, address, facebook_url, instagram_url, twitter_url, linkedin_url, youtube_url, hourly_rate, currency, available_for_hire, category_id, review_count, media_count',
    )
    .eq('city_id', cityId)
    .eq('status', 'ACTIVE')
    .eq('visibility', 'PUBLIC')
    .order('name', { ascending: true });
  if (error) {
    console.error('[fetchCityServices]', error);
    return [];
  }
  return (data ?? []).flatMap((row) => {
    const r = row as CityServiceRow;
    const category = r.category_id ? findCategoryById(r.category_id) : undefined;
    if (!category) return [];
    const basic: ProfessionalServiceBasic = {
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description ?? undefined,
      logoUrl: cfImageUrl(r.logo_cf_image_id),
      adImageUrl: cfImageUrl(r.ad_cf_image_id) ?? cfImageUrl(r.cover_cf_image_id),
      address: r.address ?? undefined,
      facebookUrl: r.facebook_url ?? undefined,
      instagramUrl: r.instagram_url ?? undefined,
      twitterUrl: r.twitter_url ?? undefined,
      linkedinUrl: r.linkedin_url ?? undefined,
      youtubeUrl: r.youtube_url ?? undefined,
      hourlyRate: r.hourly_rate ?? undefined,
      currency: r.currency,
      availableForHire: r.available_for_hire,
      category: { id: category.id, name: category.name },
      _count: { reviews: r.review_count ?? 0, media: r.media_count ?? 0 },
    };
    return [basic];
  });
}

export const getCityServices = cache(async (cityId: string): Promise<ProfessionalServiceBasic[]> => {
  const client = await getServerClient();
  return fetchCityServices(client, cityId);
});

/** Professional-services taxonomy categories — the grouping/filter axis for
 *  ServiceList. Pure (the taxonomy is a static file), so no DB round-trip. */
export function getServiceDirectoryCategories(): ProfessionalServiceCategory[] {
  return SERVICE_CATEGORIES.map((c) => ({ id: c.id, name: c.name, createdAt: '' }));
}
