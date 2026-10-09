import 'server-only';
import { cache } from 'react';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';

export type CommunityAccessPreview = {
  id: string;
  name: string;
  slug: string;
  privacy: 'PRIVATE' | 'SECRET';
};

/** Exact links expose minimal private identity; secret identity requires an invitation. */
export const getCommunityAccessPreview = cache(async (
  slug: string,
): Promise<CommunityAccessPreview | null> => {
  if (!slug || slug.length > 120) return null;

  const client = await getServerClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return null;

  // Only minimal identity crosses RLS; secret communities require an invited viewer.
  const { data, error } = await getServiceClient().from('communities')
    .select('id,name,slug,privacy')
    .eq('slug', slug)
    .in('privacy', ['PRIVATE', 'SECRET'])
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (data.privacy === 'SECRET') {
    const { data: invite, error: inviteError } = await client.from('community_invitations')
      .select('id')
      .eq('community_id', data.id)
      .eq('invitee_id', auth.user.id)
      .eq('status', 'pending')
      .maybeSingle();
    if (inviteError) throw inviteError;
    if (!invite) return null;
  }
  return data as CommunityAccessPreview;
});
