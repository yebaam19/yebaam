import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import { cfImageUrl } from './cf';

export interface CityTrendingItem {
  id: string;
  title: string;
  coverImageUrl?: string;
  publishedAt: string;
}

type TrendingRow = {
  id: string;
  title: string;
  cover_cf_image_id: string | null;
  published_at: string | null;
};

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
    const r = row as TrendingRow;
    return {
      id: r.id,
      title: r.title,
      coverImageUrl: cfImageUrl(r.cover_cf_image_id),
      publishedAt: r.published_at ?? new Date(0).toISOString(),
    };
  });
}

export const getCityTrending = cache(
  async (cityId: string, limit = 3): Promise<CityTrendingItem[]> => {
    const client = await getServerClient();
    return fetchCityTrending(client, cityId, limit);
  },
);
