import { useInfiniteQuery } from '@tanstack/react-query';
import { pageCommunityService, FollowerSortBy } from '../services/page-community.service';

// Query Keys
export const pageCommunityKeys = {
  all: ['page-community'] as const,
  followers: () => [...pageCommunityKeys.all, 'followers'] as const,
  followersList: (pageId: string, sortBy?: FollowerSortBy) => 
    [...pageCommunityKeys.followers(), pageId, sortBy || 'recent'] as const,
};

/**
 * Hook para obtener seguidores de una página con paginación infinita
 */
export function usePageFollowers(
  pageId: string | undefined, 
  limit: number = 20,
  sortBy: FollowerSortBy = 'recent'
) {
  return useInfiniteQuery({
    queryKey: pageCommunityKeys.followersList(pageId!, sortBy),
    queryFn: ({ pageParam = 1 }) =>
      pageCommunityService.getPageFollowers(pageId!, pageParam, limit, sortBy),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!pageId,
    initialPageParam: 1,
  });
}
