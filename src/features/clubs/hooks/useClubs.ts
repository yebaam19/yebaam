'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { cacheKey, clearCached, invalidate, setCached } from '@/lib/hooks/cacheStore';
import { clubsService } from '../services/clubs.service';
import type { CreateClubDto, UpdateClubDto, SearchClubsParams } from '../types/club.types';

type CachedRecord<T> = { data: T; fetchedAt: number };

export function useMyClubs() {
  return useFetch(
    ['clubs', 'my-clubs'],
    () => clubsService.getMyClubs(),
    { staleTime: 1000 * 60 * 5 }
  );
}

export function useSuggestedClubs(limit?: number) {
  return useFetch(
    ['clubs', 'suggested', limit],
    () => clubsService.getSuggestedClubs(limit),
    { staleTime: 1000 * 60 * 10 }
  );
}

export function useSuggestedClubsPage(page: number, limit: number = 12) {
  return useFetch(
    ['clubs', 'suggested', 'page', page, limit],
    () => clubsService.getSuggestedClubsPage(page, limit),
    { staleTime: 1000 * 60 * 5 }
  );
}

export function useSearchClubs(params: SearchClubsParams) {
  return useFetch(
    ['clubs', 'search', JSON.stringify(params)],
    () => clubsService.searchClubs(params),
    {
      enabled: !!params.query || !!params.category,
      staleTime: 1000 * 60 * 5,
    }
  );
}

export function useClub(clubId: string) {
  return useFetch(
    ['clubs', clubId],
    () => clubsService.getClubById(clubId),
    { enabled: !!clubId, staleTime: 1000 * 60 * 5 }
  );
}

export function useClubBySlug(slug: string) {
  return useFetch(
    ['clubs', 'slug', slug],
    () => clubsService.getClubBySlug(slug),
    { enabled: !!slug, staleTime: 1000 * 60 * 5 }
  );
}

export function useClubsByCategory(category: string, limit?: number) {
  return useFetch(
    ['clubs', 'category', category, limit],
    () => clubsService.getClubsByCategory(category, limit),
    { enabled: !!category, staleTime: 1000 * 60 * 10 }
  );
}

export function usePopularClubs(limit?: number) {
  return useFetch(
    ['clubs', 'popular', limit],
    () => clubsService.getPopularClubs(limit),
    { staleTime: 1000 * 60 * 15 }
  );
}

export function usePopularClubsPage(page: number, limit: number = 12) {
  return useFetch(
    ['clubs', 'popular', 'page', page, limit],
    () => clubsService.getPopularClubsPage(page, limit),
    { staleTime: 1000 * 60 * 10 }
  );
}

export function useTrendingClubs(limit?: number) {
  return useFetch(
    ['clubs', 'trending', limit],
    () => clubsService.getTrendingClubs(limit),
    { staleTime: 1000 * 60 * 15 }
  );
}

export function useJoinClub() {
  return useAsyncAction(
    (clubId: string) => clubsService.joinClub(clubId),
    {
      onSuccess: (_, clubId) => {
        invalidate(`clubs::${clubId}`);
        invalidate('clubs::my-clubs');
        invalidate('clubs::suggested');
        invalidate('clubs::search');
      },
    }
  );
}

export function useLeaveClub() {
  return useAsyncAction(
    (clubId: string) => clubsService.leaveClub(clubId),
    {
      onSuccess: (_, clubId) => {
        invalidate(`clubs::${clubId}`);
        invalidate('clubs::my-clubs');
        invalidate('clubs::suggested');
        invalidate('clubs::search');
      },
    }
  );
}

export function useCreateClub() {
  return useAsyncAction(
    (data: CreateClubDto) => clubsService.createClub(data),
    {
      onSuccess: (newClub) => {
        invalidate('clubs::my-clubs');
        invalidate('clubs::search');
        setCached<CachedRecord<typeof newClub>>(cacheKey('clubs', newClub.id), {
          data: newClub,
          fetchedAt: Date.now(),
        });
      },
    }
  );
}

export function useUpdateClub(clubId: string) {
  return useAsyncAction(
    (data: UpdateClubDto) => clubsService.updateClub(clubId, data),
    {
      onSuccess: (updatedClub) => {
        setCached<CachedRecord<typeof updatedClub>>(cacheKey('clubs', clubId), {
          data: updatedClub,
          fetchedAt: Date.now(),
        });
        invalidate('clubs::my-clubs');
        invalidate('clubs::search');
      },
    }
  );
}

export function useDeleteClub() {
  return useAsyncAction(
    (clubId: string) => clubsService.deleteClub(clubId),
    {
      onSuccess: (_, clubId) => {
        clearCached(cacheKey('clubs', clubId));
        invalidate('clubs::my-clubs');
        invalidate('clubs::search');
      },
    }
  );
}

export function useToggleClubMembership() {
  const joinMutation = useJoinClub();
  const leaveMutation = useLeaveClub();

  return {
    toggleMembership: async (clubId: string, isMember: boolean) => {
      if (isMember) {
        await leaveMutation.mutateAsync(clubId);
      } else {
        await joinMutation.mutateAsync(clubId);
      }
    },
    isLoading: joinMutation.isPending || leaveMutation.isPending,
  };
}

export function useClubMembers(clubId: string, page: number = 1, limit: number = 20) {
  return useFetch(
    ['clubs', clubId, 'members', page, limit],
    () => clubsService.getClubMembers(clubId, page, limit),
    { enabled: !!clubId, staleTime: 1000 * 60 * 5 }
  );
}

export function useAssignRole() {
  return useAsyncAction(
    ({
      clubId,
      userId,
      role,
    }: {
      clubId: string;
      userId: string;
      role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
    }) => clubsService.assignRole(clubId, userId, role),
    {
      onSuccess: (_, { clubId }) => {
        invalidate(`clubs::${clubId}::members`);
        invalidate(`clubs::${clubId}`);
      },
    }
  );
}

export function useRemoveMember() {
  return useAsyncAction(
    ({ clubId, userId }: { clubId: string; userId: string }) =>
      clubsService.removeMember(clubId, userId),
    {
      onSuccess: (_, { clubId }) => {
        invalidate(`clubs::${clubId}::members`);
        invalidate(`clubs::${clubId}`);
      },
    }
  );
}

export function useUploadClubImage(_type: 'profile' | 'cover') {
  return useAsyncAction(async (file: File) => {
    const { uploadService } = await import('@/lib/service/upload.service');
    // House rule: `id` is what gets persisted (bare Cloudflare Images id);
    // `fileUrl` is only for immediate previews.
    const { id, url } = await uploadService.uploadImage(file);
    return { id, fileUrl: url };
  });
}
