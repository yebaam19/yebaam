import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsService, type CreateGroupRequest, type UpdateGroupRequest } from '../services/groups.service';
import type { Group } from '../types/group.types';
import { toast } from 'sonner';

// Query Keys
export const groupsKeys = {
  all: ['groups'] as const,
  myGroups: () => [...groupsKeys.all, 'my-groups'] as const,
  suggestions: () => [...groupsKeys.all, 'suggestions'] as const,
  search: (query: string) => [...groupsKeys.all, 'search', query] as const,
  detail: (id: string) => [...groupsKeys.all, 'detail', id] as const,
};

/**
 * Hook para obtener mis grupos
 */
export function useMyGroups() {
  return useQuery({
    queryKey: groupsKeys.myGroups(),
    queryFn: () => groupsService.getMyGroups(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener grupos sugeridos
 */
export function useSuggestedGroups() {
  return useQuery({
    queryKey: groupsKeys.suggestions(),
    queryFn: () => groupsService.getSuggestedGroups(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para buscar grupos
 */
export function useSearchGroups(query: string, enabled = true) {
  return useQuery({
    queryKey: groupsKeys.search(query),
    queryFn: () => groupsService.searchGroups(query),
    enabled: enabled && query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para obtener detalles de un grupo
 */
export function useGroup(groupId: string) {
  return useQuery({
    queryKey: groupsKeys.detail(groupId),
    queryFn: () => groupsService.getGroupById(groupId),
    enabled: !!groupId,
  });
}

/**
 * Hook para unirse a un grupo
 */
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => groupsService.joinGroup(groupId),
    onMutate: async (groupId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: groupsKeys.suggestions() });
      
      const previousSuggestions = queryClient.getQueryData<Group[]>(groupsKeys.suggestions());

      // Actualizar el grupo en sugerencias
      queryClient.setQueryData<Group[]>(groupsKeys.suggestions(), (old) =>
        old?.map((group) =>
          group.id === groupId ? { ...group, isMember: true } : group
        )
      );

      return { previousSuggestions };
    },
    onSuccess: (_, groupId) => {
      toast.success('Te has unido al grupo exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: groupsKeys.myGroups() });
      queryClient.invalidateQueries({ queryKey: groupsKeys.detail(groupId) });
    },
    onError: (error, _, context) => {
      // Revertir optimistic update
      if (context?.previousSuggestions) {
        queryClient.setQueryData(groupsKeys.suggestions(), context.previousSuggestions);
      }
      
      console.error('[useJoinGroup] Error:', error);
      toast.error('Error al unirse al grupo');
    },
    onSettled: () => {
      // Refetch para asegurar consistencia
      queryClient.invalidateQueries({ queryKey: groupsKeys.suggestions() });
    },
  });
}

/**
 * Hook para salir de un grupo
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => groupsService.leaveGroup(groupId),
    onMutate: async (groupId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: groupsKeys.myGroups() });
      
      const previousMyGroups = queryClient.getQueryData<Group[]>(groupsKeys.myGroups());

      // Remover el grupo de mis grupos
      queryClient.setQueryData<Group[]>(groupsKeys.myGroups(), (old) =>
        old?.filter((group) => group.id !== groupId)
      );

      return { previousMyGroups };
    },
    onSuccess: (_, groupId) => {
      toast.success('Has salido del grupo');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: groupsKeys.suggestions() });
      queryClient.invalidateQueries({ queryKey: groupsKeys.detail(groupId) });
    },
    onError: (error, _, context) => {
      // Revertir optimistic update
      if (context?.previousMyGroups) {
        queryClient.setQueryData(groupsKeys.myGroups(), context.previousMyGroups);
      }
      
      console.error('[useLeaveGroup] Error:', error);
      toast.error('Error al salir del grupo');
    },
    onSettled: () => {
      // Refetch para asegurar consistencia
      queryClient.invalidateQueries({ queryKey: groupsKeys.myGroups() });
    },
  });
}

/**
 * Hook para crear un nuevo grupo
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupRequest) => groupsService.createGroup(data),
    onSuccess: (newGroup) => {
      toast.success('Grupo creado exitosamente');
      
      // Agregar el nuevo grupo a mis grupos
      queryClient.setQueryData<Group[]>(groupsKeys.myGroups(), (old) => 
        old ? [newGroup, ...old] : [newGroup]
      );
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: groupsKeys.myGroups() });
    },
    onError: (error) => {
      console.error('[useCreateGroup] Error:', error);
      toast.error('Error al crear el grupo');
    },
  });
}

/**
 * Hook para actualizar un grupo
 */
export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateGroupRequest) => groupsService.updateGroup(groupId, data),
    onSuccess: (updatedGroup) => {
      toast.success('Grupo actualizado exitosamente');
      
      // Actualizar el grupo en el cache
      queryClient.setQueryData<Group>(groupsKeys.detail(groupId), updatedGroup);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: groupsKeys.myGroups() });
      queryClient.invalidateQueries({ queryKey: groupsKeys.detail(groupId) });
    },
    onError: (error) => {
      console.error('[useUpdateGroup] Error:', error);
      toast.error('Error al actualizar el grupo');
    },
  });
}

/**
 * Hook para eliminar un grupo
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => groupsService.deleteGroup(groupId),
    onMutate: async (groupId) => {
      // Cancelar cualquier refetch en progreso del grupo
      await queryClient.cancelQueries({ queryKey: groupsKeys.detail(groupId) });
      
      // Remover inmediatamente el grupo del cache para evitar refetch
      queryClient.removeQueries({ queryKey: groupsKeys.detail(groupId) });
      
      // Optimistic update: remover de mis grupos
      queryClient.setQueryData<Group[]>(groupsKeys.myGroups(), (old) =>
        old?.filter((group) => group.id !== groupId)
      );
    },
    onSuccess: (_, groupId) => {
      toast.success('Grupo eliminado exitosamente');
      
      // Invalidar queries relacionadas (pero no del grupo eliminado)
      queryClient.invalidateQueries({ queryKey: groupsKeys.myGroups() });
      queryClient.invalidateQueries({ queryKey: groupsKeys.suggestions() });
    },
    onError: (error, groupId) => {
      console.error('[useDeleteGroup] Error:', error);
      toast.error('Error al eliminar el grupo');
      
      // Revalidar en caso de error
      queryClient.invalidateQueries({ queryKey: groupsKeys.myGroups() });
      queryClient.invalidateQueries({ queryKey: groupsKeys.detail(groupId) });
    },
  });
}
