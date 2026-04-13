'use client';

/**
 * Hook para usar datos mock en desarrollo
 * Cambia USE_MOCK_DATA a false cuando el backend esté listo
 */

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { invalidate } from '@/lib/hooks/cacheStore';
import type { Page, CreatePageDto, PageCategory, PagePrivacy } from '../types/page.types';
import {
  mockPages,
  mockMyPages,
  mockFollowedPages,
  mockSuggestedPages,
} from '../mocks/pages.mock';

// Flag para activar/desactivar mocks
const USE_MOCK_DATA = false;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useMockPages = () => {
  const useMyPagesMock = () => {
    return useFetch(
      ['pages', 'my-pages'],
      async () => {
        await delay(800);
        return mockMyPages;
      },
      { enabled: USE_MOCK_DATA }
    );
  };

  const useFollowedPagesMock = () => {
    return useFetch(
      ['pages', 'followed'],
      async () => {
        await delay(600);
        return mockFollowedPages;
      },
      { enabled: USE_MOCK_DATA }
    );
  };

  const useSuggestedPagesMock = () => {
    return useFetch(
      ['pages', 'suggested'],
      async () => {
        await delay(700);
        return mockSuggestedPages;
      },
      { enabled: USE_MOCK_DATA }
    );
  };

  const useSearchPagesMock = (params: any) => {
    return useFetch(
      ['pages', 'search', JSON.stringify(params)],
      async () => {
        await delay(500);
        let results = [...mockPages];

        if (params.query) {
          const query = params.query.toLowerCase();
          results = results.filter(
            (page) =>
              page.name.toLowerCase().includes(query) ||
              page.description?.toLowerCase().includes(query)
          );
        }

        if (params.category) {
          results = results.filter((page) => page.category === params.category);
        }

        if (params.verified) {
          results = results.filter((page) => page.isVerified);
        }

        return { pages: results, total: results.length };
      },
      { enabled: USE_MOCK_DATA && !!(params.query || params.category || params.verified) }
    );
  };

  const useCreatePageMock = () => {
    return useAsyncAction(
      async (data: CreatePageDto) => {
        await delay(1500);
        const newPage: Page = {
          id: `mock-${Date.now()}`,
          name: data.name,
          description: data.description,
          category: data.category as PageCategory,
          subcategory: data.subcategory,
          coverImageUrl: data.coverImageUrl,
          contact: data.contact,
          isFollowing: false,
          isVerified: false,
          ownerId: 'current-user',
          ownerName: 'Usuario Actual',
          ownerUsername: 'current-user',
          userRole: 'OWNER',
          privacy: (data.privacy?.toUpperCase() as PagePrivacy) || 'PUBLIC',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          slug: '',
          followerCount: 0,
          postCount: 0,
        };
        return newPage;
      },
      {
        onSuccess: () => {
          invalidate('pages');
        },
      }
    );
  };

  const useFollowPageMock = () => {
    return useAsyncAction(
      async (_pageId: string) => {
        await delay(300);
        return { success: true };
      },
      {
        onSuccess: () => {
          invalidate('pages');
        },
      }
    );
  };

  const useUnfollowPageMock = () => {
    return useAsyncAction(
      async (_pageId: string) => {
        await delay(300);
        return { success: true };
      },
      {
        onSuccess: () => {
          invalidate('pages');
        },
      }
    );
  };

  return {
    useMyPagesMock,
    useFollowedPagesMock,
    useSuggestedPagesMock,
    useSearchPagesMock,
    useCreatePageMock,
    useFollowPageMock,
    useUnfollowPageMock,
    USE_MOCK_DATA,
  };
};
