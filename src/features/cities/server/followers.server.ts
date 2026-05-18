import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';

/**
 * Whether `userId` follows `cityId`. Returns false for anonymous callers
 * (no userId) without making a DB round-trip.
 */
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

export const getIsFollowing = cache(
  async (cityId: string, userId: string | null): Promise<boolean> => {
    const client = await getServerClient();
    return fetchIsFollowing(client, cityId, userId);
  },
);
