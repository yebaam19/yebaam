'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { cacheKey, invalidate, setCached, updateCached } from '@/lib/hooks/cacheStore';
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

type CachedRecord<T> = { data: T; fetchedAt: number };
const MY_GROUPS_KEY = cacheKey('groups', 'my-groups');

export function useMyGroups() {
  return useFetch(
    groupsKeys.myGroups(),
    () => groupsService.getMyGroups(),
    { staleTime: 5 * 60 * 1000 }
  );
}

export function useSuggestedGroups() {
  return useFetch(
    groupsKeys.suggestions(),
    () => groupsService.getSuggestedGroups(),
    { staleTime: 10 * 60 * 1000 }
  );
}

export function useSearchGroups(query: string, enabled = true) {
  return useFetch(
    groupsKeys.search(query),
    () => groupsService.searchGroups(query),
    { enabled: enabled && query.length > 0, staleTime: 2 * 60 * 1000 }
  );
}

export function useGroup(groupId: string) {
  return useFetch(
    groupsKeys.detail(groupId),
    () => groupsService.getGroupById(groupId),
    { enabled: !!groupId }
  );
}

export function useJoinGroup() {
  return useAsyncAction(
    (groupId: string) => groupsService.joinGroup(groupId),
    {
      onSuccess: (_, groupId) => {
        toast.success('Te has unido al grupo exitosamente');
        invalidate('groups::my-groups');
        invalidate(`groups::detail::${groupId}`);
        invalidate('groups::suggestions');
      },
      onError: (error) => {
        console.error('[useJoinGroup] Error:', error);
        toast.error('Error al unirse al grupo');
      },
    }
  );
}

export function useLeaveGroup() {
  return useAsyncAction(
    (groupId: string) => groupsService.leaveGroup(groupId),
    {
      onSuccess: (_, groupId) => {
        toast.success('Has salido del grupo');
        invalidate('groups::my-groups');
        invalidate('groups::suggestions');
        invalidate(`groups::detail::${groupId}`);
      },
      onError: (error) => {
        console.error('[useLeaveGroup] Error:', error);
        toast.error('Error al salir del grupo');
        invalidate('groups::my-groups');
      },
    }
  );
}

export function useCreateGroup() {
  return useAsyncAction(
    (data: CreateGroupRequest) => groupsService.createGroup(data),
    {
      onSuccess: (newGroup) => {
        toast.success('Grupo creado exitosamente');
        updateCached<CachedRecord<Group[]>>(MY_GROUPS_KEY, (record) => ({
          data: record?.data ? [newGroup, ...record.data] : [newGroup],
          fetchedAt: Date.now(),
        }));
        invalidate('groups::my-groups');
      },
      onError: (error) => {
        console.error('[useCreateGroup] Error:', error);
        toast.error('Error al crear el grupo');
      },
    }
  );
}

export function useUpdateGroup(groupId: string) {
  return useAsyncAction(
    (data: UpdateGroupRequest) => groupsService.updateGroup(groupId, data),
    {
      onSuccess: (updatedGroup) => {
        toast.success('Grupo actualizado exitosamente');
        setCached<CachedRecord<Group>>(cacheKey('groups', 'detail', groupId), {
          data: updatedGroup,
          fetchedAt: Date.now(),
        });
        invalidate('groups::my-groups');
        invalidate(`groups::detail::${groupId}`);
      },
      onError: (error) => {
        console.error('[useUpdateGroup] Error:', error);
        toast.error('Error al actualizar el grupo');
      },
    }
  );
}

export function useDeleteGroup() {
  return useAsyncAction(
    (groupId: string) => groupsService.deleteGroup(groupId),
    {
      onSuccess: (_, groupId) => {
        toast.success('Grupo eliminado exitosamente');
        invalidate(`groups::detail::${groupId}`);
        invalidate('groups::my-groups');
        invalidate('groups::suggestions');
      },
      onError: (error, groupId) => {
        console.error('[useDeleteGroup] Error:', error);
        toast.error('Error al eliminar el grupo');
        invalidate('groups::my-groups');
        invalidate(`groups::detail::${groupId}`);
      },
    }
  );
}
