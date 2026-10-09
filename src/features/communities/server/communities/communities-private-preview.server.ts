import 'server-only';
import { cache } from 'react';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';

export type PrivateCommunityPreview = { id: string; name: string; slug: string };

/** A shared link reveals only the name needed to request access, never profile content. */
export const getPrivateCommunityPreview = cache(async (
  slug: string,
): Promise<PrivateCommunityPreview | null> => {
  if (!slug || slug.length > 120) return null;

  const client = await getServerClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return null;

  // This exact-slug read intentionally bypasses private-community RLS. The
  // selected fields are the entire disclosure permitted before membership.
  const { data, error } = await getServiceClient().from('communities')
    .select('id,name,slug')
    .eq('slug', slug)
    .eq('privacy', 'PRIVATE')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return data;
});
