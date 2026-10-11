'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { cacheKey, getVersion, invalidate, setCached } from '@/lib/hooks/cacheStore';
import { coalescePending } from '@/lib/coalesce-pending';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useOptionalCurrentUser } from '@/features/auth/context/current-user.context';
import { communitiesService } from '../services/communities.service';
import { COMMUNITY_SUGGESTIONS_LIMIT } from '../suggestions.config';
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

export function useSuggestedCommunities(limit = COMMUNITY_SUGGESTIONS_LIMIT, initial?: Community[], initialViewerId?: string | null) {
  const { user, isInitialized } = useAuth();
  const serverUser = useOptionalCurrentUser();
  // The server identity is available before client auth finishes restoring.
  // Once initialized, the live session wins, including logout and account switches.
  const viewerId = (isInitialized ? user?.id : serverUser?.id) ?? null;
  const key = [...communitiesKeys.suggested(limit), viewerId ?? 'guest'];
  const flatKey = cacheKey(...key);
  const seed = initialViewerId === viewerId ? initial : undefined;

  // useFetch's initialData is only a display fallback. Seed its cache before
  // its fetch effect, binding the server snapshot to the verified server user.
  // Invalidation does not rerun this effect, so it still triggers a fresh read.
  useEffect(() => {
    if (seed) setCached(flatKey, { data: listInitial(seed), fetchedAt: Date.now() });
  }, [flatKey, seed]);

  return useFetch(
    key,
    () => coalescePending(
      `${flatKey}::${getVersion(flatKey)}`,
      () => communitiesService.getSuggestedCommunities(limit),
    ),
    {
      enabled: isInitialized || !!serverUser,
      initialData: listInitial(seed),
      staleTime: 5 * 60_000,
    },
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
