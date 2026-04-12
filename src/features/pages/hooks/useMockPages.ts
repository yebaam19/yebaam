/**
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Page, CreatePageDto, PageCategory, PagePrivacy } from '../types/page.types';
import {
  mockPages,
  mockMyPages,
  mockFollowedPages,
  mockSuggestedPages,
} from '../mocks/pages.mock';ara usar datos mock en desarrollo
 * Cambia USE_MOCK_DATA a false cuando el backend esté listo
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Page, CreatePageDto, PageCategory, PagePrivacy } from '../types/page.types';
import {
  mockPages,
  mockMyPages,
  mockFollowedPages,
  mockSuggestedPages,
} from '../mocks/pages.mock';

// Flag para activar/desactivar mocks
const USE_MOCK_DATA = false; // Cambiado a false para usar API real

// Simular delay de red
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useMockPages = () => {
  const queryClient = useQueryClient();

  // Query: Mis páginas
  const useMyPagesMock = () => {
    return useQuery({
      queryKey: ['pages', 'my-pages'],
      queryFn: async () => {
        await delay(800);
        return mockMyPages;
      },
      enabled: USE_MOCK_DATA,
    });
  };

  // Query: Páginas seguidas
  const useFollowedPagesMock = () => {
    return useQuery({
      queryKey: ['pages', 'followed'],
      queryFn: async () => {
        await delay(600);
        return mockFollowedPages;
      },
      enabled: USE_MOCK_DATA,
    });
  };

  // Query: Páginas sugeridas
  const useSuggestedPagesMock = () => {
    return useQuery({
      queryKey: ['pages', 'suggested'],
      queryFn: async () => {
        await delay(700);
        return mockSuggestedPages;
      },
      enabled: USE_MOCK_DATA,
    });
  };

  // Query: Buscar páginas
  const useSearchPagesMock = (params: any) => {
    return useQuery({
      queryKey: ['pages', 'search', params],
      queryFn: async () => {
        await delay(500);
        let results = [...mockPages];

        // Filtrar por query
        if (params.query) {
          const query = params.query.toLowerCase();
          results = results.filter(
            (page) =>
              page.name.toLowerCase().includes(query) ||
              page.description?.toLowerCase().includes(query)
          );
        }

        // Filtrar por categoría
        if (params.category) {
          results = results.filter((page) => page.category === params.category);
        }

        // Filtrar por verificación
        if (params.verified) {
          results = results.filter((page) => page.isVerified);
        }

        return { pages: results, total: results.length };
      },
      enabled: USE_MOCK_DATA && !!(params.query || params.category || params.verified),
    });
  };

  // Mutation: Crear página
  const useCreatePageMock = () => {
    return useMutation({
      mutationFn: async (data: CreatePageDto) => {
        await delay(1500);
        const newPage: Page = {
          id: `mock-${Date.now()}`,
          name: data.name,
          //username: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
          description: data.description,
          category: data.category as PageCategory,
          subcategory: data.subcategory,
          //avatarUrl: data.profileImageUrl,
          coverImageUrl: data.coverImageUrl,
          contact: data.contact,
          //followersCount: 0,
          isFollowing: false,
          isVerified: false,
          ownerId: 'current-user',
          ownerName: 'Usuario Actual',
          ownerUsername: 'current-user',
          userRole: 'OWNER',
          //isAdmin: true,
          privacy: (data.privacy?.toUpperCase() as PagePrivacy) || 'PUBLIC',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          slug: '',
          followerCount: 0,
          postCount: 0
        };
        return newPage;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['pages'] });
      },
    });
  };

  // Mutation: Seguir página
  const useFollowPageMock = () => {
    return useMutation({
      mutationFn: async (pageId: string) => {
        await delay(300);
        return { success: true };
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['pages'] });
      },
    });
  };

  // Mutation: Dejar de seguir página
  const useUnfollowPageMock = () => {
    return useMutation({
      mutationFn: async (pageId: string) => {
        await delay(300);
        return { success: true };
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['pages'] });
      },
    });
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
