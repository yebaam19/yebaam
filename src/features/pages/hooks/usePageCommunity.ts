'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { pageCommunityService, FollowerSortBy } from '../services/page-community.service';

// Query Keys
export const pageCommunityKeys = {
  all: ['page-community'] as const,
  followers: () => [...pageCommunityKeys.all, 'followers'] as const,
  followersList: (pageId: string, sortBy?: FollowerSortBy) =>
    [...pageCommunityKeys.followers(), pageId, sortBy || 'recent'] as const,
};

/**
 * Hook para obtener seguidores de una página.
 * TODO: pagination — original used useInfiniteQuery; only first page returned now.
 */
export function usePageFollowers(
  pageId: string | undefined,
  limit: number = 20,
  sortBy: FollowerSortBy = 'recent'
) {
  return useFetch(
    pageCommunityKeys.followersList(pageId!, sortBy),
    () => pageCommunityService.getPageFollowers(pageId!, 1, limit, sortBy),
    { enabled: !!pageId }
  );
}
