import {
  listMyCommunities,
  listPopularCommunities,
  listSecretCommunityInvitations,
  listSuggestedCommunities,
} from '@/features/communities/server/communities.server';
import { getServerClient } from '@/utils/supabase/server';
import { CommunitiesTabsClient } from '@/features/communities/components/CommunitiesTabsClient';
import { COMMUNITY_SUGGESTIONS_LIMIT } from '@/features/communities/suggestions.config';

export default async function CommunitiesPage() {
  const client = await getServerClient();
  const { data: userData } = await client.auth.getUser();
  const canCreate = !!userData.user;

  const [popular, mine, suggested, invitations] = await Promise.all([
    listPopularCommunities(12),
    listMyCommunities(),
    listSuggestedCommunities(COMMUNITY_SUGGESTIONS_LIMIT),
    listSecretCommunityInvitations(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CommunitiesTabsClient
        initialPopular={popular}
        initialMine={mine}
        initialSuggested={suggested}
        initialViewerId={userData.user?.id ?? null}
        initialInvitations={invitations}
        canCreate={canCreate}
      />
    </div>
  );
}
