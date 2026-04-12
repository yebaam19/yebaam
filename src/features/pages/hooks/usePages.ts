import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagesService } from '../services/pages.service';
import type {
  Page,
  CreatePageDto,
  UpdatePageDto,
  SearchPagesParams,
} from '../types/page.types';

// Query Keys
export const pagesKeys = {
  all: ['pages'] as const,
  lists: () => [...pagesKeys.all, 'list'] as const,
  list: (filters: SearchPagesParams) => [...pagesKeys.lists(), filters] as const,
  myPages: () => [...pagesKeys.all, 'my-pages'] as const,
  followed: () => [...pagesKeys.all, 'followed'] as const,
  suggested: () => [...pagesKeys.all, 'suggested'] as const,
  details: () => [...pagesKeys.all, 'detail'] as const,
  detail: (id: string) => [...pagesKeys.details(), id] as const,
  detailBySlug: (slug: string) => [...pagesKeys.details(), 'slug', slug] as const,
  followers: (id: string) => [...pagesKeys.all, 'followers', id] as const,
  team: (id: string) => [...pagesKeys.all, 'team', id] as const,
};

// ============================================
// QUERIES - Data Fetching
// ============================================

/**
 * Hook para obtener las páginas propias del usuario
 */
export function useMyPages() {
  return useQuery({
    queryKey: pagesKeys.myPages(),
    queryFn: () => pagesService.getMyPages(),
    staleTime: 30000, // 30 segundos
  });
}

/**
 * Hook para obtener las páginas que sigue el usuario
 */
export function useFollowedPages() {
  return useQuery({
    queryKey: pagesKeys.followed(),
    queryFn: () => pagesService.getFollowedPages(),
    staleTime: 30000,
  });
}

/**
 * Hook para obtener páginas sugeridas
 */
export function useSuggestedPages(limit = 10) {
  return useQuery({
    queryKey: [...pagesKeys.suggested(), limit],
    queryFn: () => pagesService.getSuggestedPages(limit),
    staleTime: 60000, // 1 minuto
  });
}

/**
 * Hook para buscar páginas con filtros
 */
export function useSearchPages(params: SearchPagesParams) {
  return useQuery({
    queryKey: pagesKeys.list(params),
    queryFn: () => pagesService.searchPages(params),
    enabled: !!params.query || !!params.category || !!params.verified,
    staleTime: 20000,
  });
}

/**
 * Hook para obtener detalle de una página por ID
 */
export function usePageById(pageId: string | null) {
  return useQuery({
    queryKey: pagesKeys.detail(pageId!),
    queryFn: () => pagesService.getPageById(pageId!),
    enabled: !!pageId,
    staleTime: 30000,
  });
}

/**
 * Hook para obtener detalle de una página por username
 */
export function usePageByUsername(username: string | null) {
  return useQuery({
    queryKey: [...pagesKeys.details(), 'username', username],
    queryFn: () => pagesService.getPageByUsername(username!),
    enabled: !!username,
    staleTime: 30000,
  });
}

/**
 * Hook para obtener detalle de una página por slug
 */
export function usePageBySlug(slug: string | null) {
  return useQuery({
    queryKey: pagesKeys.detailBySlug(slug!),
    queryFn: () => pagesService.getPageBySlug(slug!),
    enabled: !!slug,
    staleTime: 30000,
  });
}

/**
 * Hook para obtener seguidores de una página
 */
export function usePageFollowers(pageId: string | null) {
  return useQuery({
    queryKey: pagesKeys.followers(pageId!),
    queryFn: () => pagesService.getFollowers(pageId!),
    enabled: !!pageId,
  });
}

/**
 * Hook para obtener miembros del equipo de una página
 */
export function usePageTeam(pageId: string | null) {
  return useQuery({
    queryKey: pagesKeys.team(pageId!),
    queryFn: () => pagesService.getTeamMembers(pageId!),
    enabled: !!pageId,
  });
}

// ============================================
// MUTATIONS - Data Modification
// ============================================

/**
 * Hook para crear una nueva página
 */
export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageData: CreatePageDto) => pagesService.createPage(pageData),
    onSuccess: () => {
      // Invalidar la lista de páginas propias
      queryClient.invalidateQueries({ queryKey: pagesKeys.myPages() });
      queryClient.invalidateQueries({ queryKey: pagesKeys.lists() });
    },
  });
}

/**
 * Hook para actualizar una página
 */
export function useUpdatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, data }: { pageId: string; data: UpdatePageDto }) =>
      pagesService.updatePage(pageId, data),
    onSuccess: (updatedPage) => {
      // Actualizar el detalle de la página
      queryClient.setQueryData(pagesKeys.detail(updatedPage.id), (old: any) => ({
        ...old,
        page: updatedPage,
      }));
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: pagesKeys.myPages() });
      queryClient.invalidateQueries({ queryKey: pagesKeys.lists() });
    },
  });
}

/**
 * Hook para eliminar una página
 */
export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: string) => pagesService.deletePage(pageId),
    onMutate: async (pageId) => {
      // Cancelar queries relacionadas
      await queryClient.cancelQueries({ queryKey: pagesKeys.detail(pageId) });
      await queryClient.cancelQueries({ queryKey: pagesKeys.myPages() });

      // Snapshot del estado anterior
      const previousMyPages = queryClient.getQueryData(pagesKeys.myPages());

      // Optimistic update: remover de la lista
      queryClient.setQueryData<Page[]>(pagesKeys.myPages(), (old) =>
        old ? old.filter((page) => page.id !== pageId) : []
      );

      return { previousMyPages };
    },
    onError: (err, pageId, context) => {
      // Revertir en caso de error
      if (context?.previousMyPages) {
        queryClient.setQueryData(pagesKeys.myPages(), context.previousMyPages);
      }
    },
    onSuccess: () => {
      // Invalidar después de éxito
      queryClient.invalidateQueries({ queryKey: pagesKeys.myPages() });
      queryClient.invalidateQueries({ queryKey: pagesKeys.lists() });
    },
  });
}

/**
 * Hook para seguir una página
 */
export function useFollowPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: string) => pagesService.followPage(pageId),
    onMutate: async (pageId) => {
      // Optimistic update del detalle
      await queryClient.cancelQueries({ queryKey: pagesKeys.detail(pageId) });

      const previousDetail = queryClient.getQueryData(pagesKeys.detail(pageId));

      queryClient.setQueryData(pagesKeys.detail(pageId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isFollowing: true,
          page: {
            ...old.page,
            followersCount: old.page.followersCount + 1,
            isFollowing: true,
          },
        };
      });

      return { previousDetail };
    },
    onError: (err, pageId, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(pagesKeys.detail(pageId), context.previousDetail);
      }
    },
    onSuccess: (_, pageId) => {
      // Invalidar todas las queries relacionadas con páginas
      queryClient.invalidateQueries({ queryKey: pagesKeys.details() });
      queryClient.invalidateQueries({ queryKey: pagesKeys.followed() });
      queryClient.invalidateQueries({ queryKey: pagesKeys.suggested() });
      queryClient.invalidateQueries({ queryKey: pagesKeys.myPages() });
    },
  });
}

/**
 * Hook para dejar de seguir una página
 */
export function useUnfollowPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: string) => pagesService.unfollowPage(pageId),
    onMutate: async (pageId) => {
      await queryClient.cancelQueries({ queryKey: pagesKeys.detail(pageId) });

      const previousDetail = queryClient.getQueryData(pagesKeys.detail(pageId));

      queryClient.setQueryData(pagesKeys.detail(pageId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isFollowing: false,
          page: {
            ...old.page,
            followersCount: Math.max(0, old.page.followersCount - 1),
            isFollowing: false,
          },
        };
      });

      return { previousDetail };
    },
    onError: (err, pageId, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(pagesKeys.detail(pageId), context.previousDetail);
      }
    },
    onSuccess: (_, pageId) => {
      // Invalidar todas las queries relacionadas con páginas
      queryClient.invalidateQueries({ queryKey: pagesKeys.details() });
      queryClient.invalidateQueries({ queryKey: pagesKeys.followed() });
      queryClient.invalidateQueries({ queryKey: pagesKeys.suggested() });
      queryClient.invalidateQueries({ queryKey: pagesKeys.myPages() });
    },
  });
}

/**
 * Hook para asignar rol a un usuario
 */
export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, userId, role }: { pageId: string; userId: string; role: string }) =>
      pagesService.assignRole(pageId, { userId, role: role as any }),
    onSuccess: (_, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: pagesKeys.team(pageId) });
    },
  });
}

/**
 * Hook para remover rol de un usuario
 */
export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, userId }: { pageId: string; userId: string }) =>
      pagesService.removeRole(pageId, userId),
    onSuccess: (_, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: pagesKeys.team(pageId) });
    },
  });
}
