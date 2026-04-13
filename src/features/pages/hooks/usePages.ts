'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { cacheKey, invalidate, updateCached } from '@/lib/hooks/cacheStore';
import { pagesService } from '../services/pages.service';
import type {
  CreatePageDto,
  UpdatePageDto,
  SearchPagesParams,
} from '../types/page.types';

// Query Keys
export const pagesKeys = {
  all: ['pages'] as const,
  lists: () => [...pagesKeys.all, 'list'] as const,
  list: (filters: SearchPagesParams) => [...pagesKeys.lists(), JSON.stringify(filters)] as const,
  myPages: () => [...pagesKeys.all, 'my-pages'] as const,
  followed: () => [...pagesKeys.all, 'followed'] as const,
  suggested: () => [...pagesKeys.all, 'suggested'] as const,
  details: () => [...pagesKeys.all, 'detail'] as const,
  detail: (id: string) => [...pagesKeys.details(), id] as const,
  detailBySlug: (slug: string) => [...pagesKeys.details(), 'slug', slug] as const,
  followers: (id: string) => [...pagesKeys.all, 'followers', id] as const,
  team: (id: string) => [...pagesKeys.all, 'team', id] as const,
};

type CachedRecord<T> = { data: T; fetchedAt: number };

// QUERIES
export function useMyPages() {
  return useFetch(pagesKeys.myPages(), () => pagesService.getMyPages(), { staleTime: 30000 });
}

export function useFollowedPages() {
  return useFetch(pagesKeys.followed(), () => pagesService.getFollowedPages(), {
    staleTime: 30000,
  });
}

export function useSuggestedPages(limit = 10) {
  return useFetch(
    [...pagesKeys.suggested(), limit],
    () => pagesService.getSuggestedPages(limit),
    { staleTime: 60000 }
  );
}

export function useSearchPages(params: SearchPagesParams) {
  return useFetch(
    pagesKeys.list(params),
    () => pagesService.searchPages(params),
    {
      enabled: !!params.query || !!params.category || !!params.verified,
      staleTime: 20000,
    }
  );
}

export function usePageById(pageId: string | null) {
  return useFetch(
    pagesKeys.detail(pageId!),
    () => pagesService.getPageById(pageId!),
    { enabled: !!pageId, staleTime: 30000 }
  );
}

export function usePageByUsername(username: string | null) {
  return useFetch(
    [...pagesKeys.details(), 'username', username],
    () => pagesService.getPageByUsername(username!),
    { enabled: !!username, staleTime: 30000 }
  );
}

export function usePageBySlug(slug: string | null) {
  return useFetch(
    pagesKeys.detailBySlug(slug!),
    () => pagesService.getPageBySlug(slug!),
    { enabled: !!slug, staleTime: 30000 }
  );
}

export function usePageFollowers(pageId: string | null) {
  return useFetch(
    pagesKeys.followers(pageId!),
    () => pagesService.getFollowers(pageId!),
    { enabled: !!pageId }
  );
}

export function usePageTeam(pageId: string | null) {
  return useFetch(
    pagesKeys.team(pageId!),
    () => pagesService.getTeamMembers(pageId!),
    { enabled: !!pageId }
  );
}

// MUTATIONS
export function useCreatePage() {
  return useAsyncAction(
    (pageData: CreatePageDto) => pagesService.createPage(pageData),
    {
      onSuccess: () => {
        invalidate('pages::my-pages');
        invalidate('pages::list');
      },
    }
  );
}

export function useUpdatePage() {
  return useAsyncAction(
    ({ pageId, data }: { pageId: string; data: UpdatePageDto }) =>
      pagesService.updatePage(pageId, data),
    {
      onSuccess: (updatedPage) => {
        updateCached<CachedRecord<any>>(
          cacheKey('pages', 'detail', updatedPage.id),
          (record) => ({
            data: { ...(record?.data ?? {}), page: updatedPage },
            fetchedAt: Date.now(),
          })
        );
        invalidate('pages::my-pages');
        invalidate('pages::list');
      },
    }
  );
}

export function useDeletePage() {
  return useAsyncAction(
    (pageId: string) => pagesService.deletePage(pageId),
    {
      onSuccess: () => {
        invalidate('pages::my-pages');
        invalidate('pages::list');
      },
      onError: () => {
        invalidate('pages::my-pages');
      },
    }
  );
}

export function useFollowPage() {
  return useAsyncAction(
    (pageId: string) => pagesService.followPage(pageId),
    {
      onSuccess: () => {
        invalidate('pages::detail');
        invalidate('pages::followed');
        invalidate('pages::suggested');
        invalidate('pages::my-pages');
      },
    }
  );
}

export function useUnfollowPage() {
  return useAsyncAction(
    (pageId: string) => pagesService.unfollowPage(pageId),
    {
      onSuccess: () => {
        invalidate('pages::detail');
        invalidate('pages::followed');
        invalidate('pages::suggested');
        invalidate('pages::my-pages');
      },
    }
  );
}

export function useAssignRole() {
  return useAsyncAction(
    ({ pageId, userId, role }: { pageId: string; userId: string; role: string }) =>
      pagesService.assignRole(pageId, { userId, role: role as any }),
    {
      onSuccess: (_, { pageId }) => {
        invalidate(`pages::team::${pageId}`);
      },
    }
  );
}

export function useRemoveRole() {
  return useAsyncAction(
    ({ pageId, userId }: { pageId: string; userId: string }) =>
      pagesService.removeRole(pageId, userId),
    {
      onSuccess: (_, { pageId }) => {
        invalidate(`pages::team::${pageId}`);
      },
    }
  );
}
