import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import { cfImageUrl } from './cf';

export type DiscoveryThumbnails = Record<string, string | undefined>;

/**
 * Shared CF image ids for the discovery tile grid, keyed by category id.
 * Returned as a plain map so the React tree doesn't need to know about the
 * underlying table. One row per category, hit once per request.
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

export const getDiscoveryThumbnails = cache(async (): Promise<DiscoveryThumbnails> => {
  const client = await getServerClient();
  return fetchDiscoveryThumbnails(client);
});
