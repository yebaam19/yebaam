import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clubsService } from '../services/clubs.service';
import type { Club, CreateClubDto, UpdateClubDto, SearchClubsParams } from '../types/club.types';

/**
 * Hook para obtener mis clubes (clubes a los que pertenezco)
 */
export function useMyClubs() {
  return useQuery({
    queryKey: ['clubs', 'my-clubs'],
    queryFn: () => clubsService.getMyClubs(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener clubes sugeridos
 */
export function useSuggestedClubs(limit?: number) {
  return useQuery({
    queryKey: ['clubs', 'suggested', limit],
    queryFn: () => clubsService.getSuggestedClubs(limit),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para buscar clubes
 */
export function useSearchClubs(params: SearchClubsParams) {
  return useQuery({
    queryKey: ['clubs', 'search', params],
    queryFn: () => clubsService.searchClubs(params),
    enabled: !!params.query || !!params.category,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener detalles de un club por ID
 */
export function useClub(clubId: string) {
  return useQuery({
    queryKey: ['clubs', clubId],
    queryFn: () => clubsService.getClubById(clubId),
    enabled: !!clubId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener un club por slug
 */
export function useClubBySlug(slug: string) {
  return useQuery({
    queryKey: ['clubs', 'slug', slug],
    queryFn: () => clubsService.getClubBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener clubes por categoría
 */
export function useClubsByCategory(category: string, limit?: number) {
  return useQuery({
    queryKey: ['clubs', 'category', category, limit],
    queryFn: () => clubsService.getClubsByCategory(category, limit),
    enabled: !!category,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook para obtener clubes populares
 */
export function usePopularClubs(limit?: number) {
  return useQuery({
    queryKey: ['clubs', 'popular', limit],
    queryFn: () => clubsService.getPopularClubs(limit),
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
}

/**
 * Hook para obtener clubes trending
 */
export function useTrendingClubs(limit?: number) {
  return useQuery({
    queryKey: ['clubs', 'trending', limit],
    queryFn: () => clubsService.getTrendingClubs(limit),
    staleTime: 1000 * 60 * 15,
  });
}

/**
 * Hook para unirse a un club
 */
export function useJoinClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId: string) => clubsService.joinClub(clubId),
    onSuccess: (_, clubId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'my-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'suggested'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'search'] });
    },
  });
}

/**
 * Hook para salir de un club
 */
export function useLeaveClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId: string) => clubsService.leaveClub(clubId),
    onSuccess: (_, clubId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'my-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'suggested'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'search'] });
    },
  });
}

/**
 * Hook para crear un nuevo club
 */
export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClubDto) => clubsService.createClub(data),
    onSuccess: (newClub) => {
      // Invalidar y actualizar queries
      queryClient.invalidateQueries({ queryKey: ['clubs', 'my-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'search'] });
      
      // Agregar el nuevo club al cache
      queryClient.setQueryData(['clubs', newClub.id], newClub);
    },
  });
}

/**
 * Hook para actualizar un club
 */
export function useUpdateClub(clubId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateClubDto) => clubsService.updateClub(clubId, data),
    onSuccess: (updatedClub) => {
      // Actualizar el cache
      queryClient.setQueryData(['clubs', clubId], updatedClub);
      queryClient.invalidateQueries({ queryKey: ['clubs', 'my-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'search'] });
    },
  });
}

/**
 * Hook para eliminar un club
 */
export function useDeleteClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId: string) => clubsService.deleteClub(clubId),
    onSuccess: (_, clubId) => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: ['clubs', clubId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'my-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'search'] });
    },
  });
}

/**
 * Hook para toggle de membresía (unirse/salir)
 */
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

/**
 * Hook para obtener miembros de un club
 */
export function useClubMembers(clubId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['clubs', clubId, 'members', page, limit],
    queryFn: () => clubsService.getClubMembers(clubId, page, limit),
    enabled: !!clubId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para asignar rol a un miembro
 */
export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clubId,
      userId,
      role,
    }: {
      clubId: string;
      userId: string;
      role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
    }) => clubsService.assignRole(clubId, userId, role),
    onSuccess: (_, { clubId }) => {
      // Invalidar lista de miembros
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
    },
  });
}

/**
 * Hook para remover un miembro del club
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clubId, userId }: { clubId: string; userId: string }) =>
      clubsService.removeMember(clubId, userId),
    onSuccess: (_, { clubId }) => {
      // Invalidar lista de miembros y stats del club
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
    },
  });
}

/**
 * Hook para subir imagen con S3
 */
export function useUploadClubImage(type: 'profile' | 'cover') {
  return useMutation({
    mutationFn: async (file: File) => {
      // Generar URL presignada
      const generateUrlFn =
        type === 'profile'
          ? clubsService.generateProfileImageUrl
          : clubsService.generateCoverImageUrl;

      const { uploadUrl, fileUrl } = await generateUrlFn(file.name, file.type, file.size);

      // Subir a S3
      await clubsService.uploadImageToS3(uploadUrl, file);

      return { fileUrl };
    },
  });
}
