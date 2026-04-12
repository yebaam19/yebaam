import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  list: (filters: SearchCommunitiesParams) => [...communitiesKeys.lists(), filters] as const,
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

/**
 * Hook to get user's communities
 */
export function useMyCommunities() {
  return useQuery({
    queryKey: communitiesKeys.my(),
    queryFn: () => communitiesService.getMyCommunities(),
  });
}

/**
 * Hook to get suggested communities
 */
export function useSuggestedCommunities(limit: number = 6) {
  return useQuery({
    queryKey: communitiesKeys.suggested(limit),
    queryFn: () => communitiesService.getSuggestedCommunities(limit),
  });
}

/**
 * Hook to search/filter communities
 */
export function useSearchCommunities(params: SearchCommunitiesParams) {
  return useQuery({
    queryKey: communitiesKeys.list(params),
    queryFn: () => communitiesService.searchCommunities(params),
    enabled: !!params,
  });
}

/**
 * Hook to get a single community by ID
 */
export function useCommunity(id: string) {
  return useQuery({
    queryKey: communitiesKeys.detail(id),
    queryFn: () => communitiesService.getCommunityById(id),
    enabled: !!id,
  });
}

/**
 * Hook to get a single community by slug
 */
export function useCommunityBySlug(slug: string) {
  return useQuery({
    queryKey: communitiesKeys.detailBySlug(slug),
    queryFn: async () => {
      const response = await communitiesService.getCommunityBySlug(slug);
      if (!response.success) {
        throw new Error(response.message || 'Community not found');
      }
      return response.data;
    },
    enabled: !!slug,
  });
}

/**
 * Hook to get popular communities
 */
export function usePopularCommunities(limit: number = 12) {
  return useQuery({
    queryKey: communitiesKeys.popular(limit),
    queryFn: () => communitiesService.getPopularCommunities(limit),
  });
}

/**
 * Hook to get trending communities
 */
export function useTrendingCommunities(limit: number = 12) {
  return useQuery({
    queryKey: communitiesKeys.trending(limit),
    queryFn: () => communitiesService.getTrendingCommunities(limit),
  });
}

/**
 * Hook to get community posts
 */
export function useCommunityPosts(communityId: string, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: communitiesKeys.posts(communityId, page),
    queryFn: () => communitiesService.getCommunityPosts(communityId, page, limit),
    enabled: !!communityId,
  });
}

/**
 * Hook to get community members
 */
export function useCommunityMembers(communityId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: communitiesKeys.members(communityId, page),
    queryFn: () => communitiesService.getCommunityMembers(communityId, page, limit),
    enabled: !!communityId,
  });
}

/**
 * Hook to join a community
 */
export function useJoinCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (communityId: string) => communitiesService.joinCommunity(communityId),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: communitiesKeys.my() });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.suggested() });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.details() });
    },
  });
}

/**
 * Hook to leave a community
 */
export function useLeaveCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (communityId: string) => communitiesService.leaveCommunity(communityId),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: communitiesKeys.my() });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.suggested() });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.details() });
    },
  });
}

/**
 * Hook to create a community
 */
export function useCreateCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommunityDto) => communitiesService.createCommunity(data),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: communitiesKeys.my() });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.lists() });
    },
  });
}

/**
 * Hook to update a community
 */
export function useUpdateCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCommunityDto) => communitiesService.updateCommunity(data),
    onSuccess: (_, variables) => {
      // Invalidate specific community and lists
      queryClient.invalidateQueries({ queryKey: communitiesKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.my() });
    },
  });
}

/**
 * Hook to delete a community
 */
export function useDeleteCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (communityId: string) => communitiesService.deleteCommunity(communityId),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: communitiesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.my() });
    },
  });
}

/**
 * Combined hook for toggling community membership
 */
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
