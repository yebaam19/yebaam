import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import { getCommunityBySlug } from './communities.server';
import { getCommunityProfileCapabilities } from './community-plan.server';
/** Shared request snapshot for routes; auth identity never comes from search params. */
export const getQuestionContext = cache(async (slug: string) => {
  const community = await getCommunityBySlug(slug);
  if (!community) return null;
  const client = await getServerClient();
  const [capabilities, { data: { user } }] = await Promise.all([
    getCommunityProfileCapabilities(community.id), client.auth.getUser(),
  ]);
  return { community, capabilities, userId: user?.id ?? null };
});
