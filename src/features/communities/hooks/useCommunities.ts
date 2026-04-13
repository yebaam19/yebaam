'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { invalidate } from '@/lib/hooks/cacheStore';
import { communitiesService } from '../services/communities.service';
import {
  Community,
  SearchCommunitiesParams,
  CreateCommunityDto,
  UpdateCommunityDto,
} from '../types/community.types';

/**
 * Query Keys for Communities
 */
export const communitiesKeys = {
  all: ['communities'] as const,
  lists: () => [...communitiesKeys.all, 'list'] as const,
  list: (filters: SearchCommunitiesParams) => [...communitiesKeys.lists(), JSON.stringify(filters)] as const,
  details: () => [...communitiesKeys.all, 'detail'] as const,
  detail: (id: string) => [...communitiesKeys.details(), id] as const,
  detailBySlug: (slug: string) => [...communitiesKeys.details(), 'slug', slug] as const,
  my: () => [...communitiesKeys.all, 'my'] as const,
  suggested: (limit?: number) => [...communitiesKeys.all, 'suggested', limit] as const,
  popular: (limit?: number) => [...communitiesKeys.all, 'popular', limit] as const,
  trending: (limit?: number) => [...communitiesKeys.all, 'trending', limit] as const,
  posts: (communityId: string, page?: number) =>
    [...communitiesKeys.all, 'posts', communityId, page] as const,
  members: (communityId: string, page?: number) =>
    [...communitiesKeys.all, 'members', communityId, page] as const,
};

export function useMyCommunities() {
  return useFetch(communitiesKeys.my(), () => communitiesService.getMyCommunities());
}

export function useSuggestedCommunities(limit: number = 6) {
  return useFetch(communitiesKeys.suggested(limit), () =>
    communitiesService.getSuggestedCommunities(limit)
  );
}

export function useSearchCommunities(params: SearchCommunitiesParams) {
  return useFetch(
    communitiesKeys.list(params),
    () => communitiesService.searchCommunities(params),
    { enabled: !!params }
  );
}

export function useCommunity(id: string) {
  return useFetch(
    communitiesKeys.detail(id),
    () => communitiesService.getCommunityById(id),
    { enabled: !!id }
  );
}

export function useCommunityBySlug(slug: string) {
  return useFetch(
    communitiesKeys.detailBySlug(slug),
    async () => {
      const response = await communitiesService.getCommunityBySlug(slug);
      if (!response.success) {
        throw new Error(response.message || 'Community not found');
      }
      return response.data;
    },
    { enabled: !!slug }
  );
}

export function usePopularCommunities(limit: number = 12) {
  return useFetch(communitiesKeys.popular(limit), () =>
    communitiesService.getPopularCommunities(limit)
  );
}

export function useTrendingCommunities(limit: number = 12) {
  return useFetch(communitiesKeys.trending(limit), () =>
    communitiesService.getTrendingCommunities(limit)
  );
}

export function useCommunityPosts(communityId: string, page: number = 1, limit: number = 10) {
  return useFetch(
    communitiesKeys.posts(communityId, page),
    () => communitiesService.getCommunityPosts(communityId, page, limit),
    { enabled: !!communityId }
  );
}

export function useCommunityMembers(communityId: string, page: number = 1, limit: number = 20) {
  return useFetch(
    communitiesKeys.members(communityId, page),
    () => communitiesService.getCommunityMembers(communityId, page, limit),
    { enabled: !!communityId }
  );
}

export function useJoinCommunity() {
  return useAsyncAction(
    (communityId: string) => communitiesService.joinCommunity(communityId),
    {
      onSuccess: () => {
        invalidate('communities::my');
        invalidate('communities::suggested');
        invalidate('communities::list');
        invalidate('communities::detail');
      },
    }
  );
}

export function useLeaveCommunity() {
  return useAsyncAction(
    (communityId: string) => communitiesService.leaveCommunity(communityId),
    {
      onSuccess: () => {
        invalidate('communities::my');
        invalidate('communities::suggested');
        invalidate('communities::list');
        invalidate('communities::detail');
      },
    }
  );
}

export function useCreateCommunity() {
  return useAsyncAction(
    (data: CreateCommunityDto) => communitiesService.createCommunity(data),
    {
      onSuccess: () => {
        invalidate('communities::my');
        invalidate('communities::list');
      },
    }
  );
}

export function useUpdateCommunity() {
  return useAsyncAction(
    (data: UpdateCommunityDto) => communitiesService.updateCommunity(data),
    {
      onSuccess: (_, variables) => {
        invalidate(`communities::detail::${variables.id}`);
        invalidate('communities::list');
        invalidate('communities::my');
      },
    }
  );
}

export function useDeleteCommunity() {
  return useAsyncAction(
    (communityId: string) => communitiesService.deleteCommunity(communityId),
    {
      onSuccess: () => {
        invalidate('communities::list');
        invalidate('communities::my');
      },
    }
  );
}

export function useToggleCommunityMembership() {
  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();

  return {
    toggle: async (community: Community) => {
      if (community.isMember) {
        return leaveMutation.mutateAsync(community.id);
      } else {
        return joinMutation.mutateAsync(community.id);
      }
    },
    isLoading: joinMutation.isPending || leaveMutation.isPending,
  };
}
