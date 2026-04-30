'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { invalidate } from '@/lib/hooks/cacheStore';
import { communitiesService } from '../services/communities.service';
import {
  Community,
  CommunitiesListResponse,
  CommunityResponse,
  CommunityMembersResponse,
  CommunityPostsResponse,
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

/**
 * Build an `initialData` shape for list-style hooks from a server-fetched
 * Community[] (RSC hydration).
 */
function listInitial(items: Community[] | undefined): CommunitiesListResponse | null {
  if (!items) return null;
  return { success: true, data: items, total: items.length, page: 1, limit: items.length };
}

export function useMyCommunities(initial?: Community[]) {
  return useFetch(
    communitiesKeys.my(),
    () => communitiesService.getMyCommunities(),
    { initialData: listInitial(initial) },
  );
}

export function useSuggestedCommunities(limit = 6, initial?: Community[]) {
  return useFetch(
    communitiesKeys.suggested(limit),
    () => communitiesService.getSuggestedCommunities(limit),
    { initialData: listInitial(initial) },
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

export function useCommunityBySlug(slug: string, initial?: Community | null) {
  return useFetch<Community>(
    communitiesKeys.detailBySlug(slug),
    async () => {
      const response = await communitiesService.getCommunityBySlug(slug);
      if (!response.success) {
        throw new Error(response.message || 'Community not found');
      }
      return response.data;
    },
    { enabled: !!slug, initialData: initial ?? null },
  );
}

export function usePopularCommunities(limit = 12, initial?: Community[]) {
  return useFetch(
    communitiesKeys.popular(limit),
    () => communitiesService.getPopularCommunities(limit),
    { initialData: listInitial(initial) },
  );
}

export function useTrendingCommunities(limit = 12) {
  return useFetch(communitiesKeys.trending(limit), () =>
    communitiesService.getTrendingCommunities(limit)
  );
}

export function useCommunityPosts(
  communityId: string,
  page = 1,
  limit = 10,
  initial?: { posts: import('../types/community.types').CommunityPost[]; total: number },
) {
  const initialResponse: CommunityPostsResponse | null = initial
    ? { success: true, data: initial.posts, total: initial.total, page, limit }
    : null;
  return useFetch(
    communitiesKeys.posts(communityId, page),
    () => communitiesService.getCommunityPosts(communityId, page, limit),
    { enabled: !!communityId, initialData: initialResponse },
  );
}

export function useCommunityMembers(
  communityId: string,
  page = 1,
  limit = 20,
  initial?: { members: import('../types/community.types').CommunityMember[]; total: number },
) {
  const initialResponse: CommunityMembersResponse | null = initial
    ? { success: true, data: initial.members, total: initial.total, page, limit }
    : null;
  return useFetch(
    communitiesKeys.members(communityId, page),
    () => communitiesService.getCommunityMembers(communityId, page, limit),
    { enabled: !!communityId, initialData: initialResponse },
  );
}

function invalidateCommunityCaches() {
  invalidate('communities::my');
  invalidate('communities::suggested');
  invalidate('communities::popular');
  invalidate('communities::list');
  invalidate('communities::detail');
}

export function useJoinCommunity() {
  return useAsyncAction(
    async (communityId: string): Promise<CommunityResponse> => {
      const response = await communitiesService.joinCommunity(communityId);
      if (!response.success) throw new Error(response.message || 'No se pudo unir');
      return response;
    },
    { onSuccess: invalidateCommunityCaches },
  );
}

export function useLeaveCommunity() {
  return useAsyncAction(
    async (communityId: string): Promise<CommunityResponse> => {
      const response = await communitiesService.leaveCommunity(communityId);
      if (!response.success) throw new Error(response.message || 'No se pudo salir');
      return response;
    },
    { onSuccess: invalidateCommunityCaches },
  );
}

export function useCreateCommunity() {
  return useAsyncAction(
    async (data: CreateCommunityDto): Promise<CommunityResponse> => {
      const response = await communitiesService.createCommunity(data);
      if (!response.success) throw new Error(response.message || 'No se pudo crear');
      return response;
    },
    { onSuccess: invalidateCommunityCaches },
  );
}

export function useUpdateCommunity() {
  return useAsyncAction(
    async (data: UpdateCommunityDto): Promise<CommunityResponse> => {
      const response = await communitiesService.updateCommunity(data);
      if (!response.success) throw new Error(response.message || 'No se pudo actualizar');
      return response;
    },
    { onSuccess: invalidateCommunityCaches },
  );
}

export function useDeleteCommunity() {
  return useAsyncAction(
    async (communityId: string) => {
      const response = await communitiesService.deleteCommunity(communityId);
      if (!response.success) throw new Error(response.message || 'No se pudo eliminar');
      return response;
    },
    { onSuccess: invalidateCommunityCaches },
  );
}

export function useToggleCommunityMembership() {
  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();

  return {
    toggle: async (community: Community) => {
      if (community.isMember) {
        return leaveMutation.mutateAsync(community.id);
      }
      return joinMutation.mutateAsync(community.id);
    },
    isLoading: joinMutation.isPending || leaveMutation.isPending,
  };
}
