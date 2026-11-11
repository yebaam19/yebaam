import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import { cfImageUrl } from './cf';
import { SERVICE_CATEGORIES, findCategoryById } from '@/features/professional-services/data/service-categories-taxonomy';
import type { ProfessionalServiceBasic, ProfessionalServiceCategory } from '../interfaces/directory.interfaces';

export { getBusinessDirectoryCategories, getCityBusinesses, getCityBusinessesByCategory } from './city-businesses.server';
export type { CityBusinessListing } from './city-businesses.server';

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
