'use client';

import { useEffect } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useFriendshipsStore } from '../store/friendships.store';
import { acquireFriendshipsRealtime } from '../store/friendships.realtime';

/**
 * useFriendships Hook
 *
 * Hook principal para gestionar amistades con:
 * - Estado global de Zustand
 * - Refresco en tiempo real vía Supabase Realtime (ver friendships.realtime.ts)
 * - Acciones para send/accept/reject/cancel
 *
 * @example
 * ```tsx
 * const {
 *   friends,
 *   pendingRequests,
 *   sendFriendRequest,
 *   acceptFriendRequest,
 * } = useFriendships();
 * ```
 */
export function useFriendships() {
  const { user, isAuthenticated, isInitialized: authInitialized } = useAuth();

  // Estado del store
  const {
    friends,
    pendingRequests,
    sentRequests,
    suggestions,
    isLoading,
    error,
    totalFriends,
    closeFriendsCount,
    pendingCount,
    suggestionsCount,
    // Actions
    fetchFriends,
    fetchPendingRequests,
    fetchSentRequests,
    fetchSuggestions,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    updateFriendConfig,
  } = useFriendshipsStore();

  // ============================================================================
  // Load after auth is ready (avoid empty snapshot when SDK/cookie are not hydrated yet)
  // ============================================================================

  useEffect(() => {
    if (!authInitialized) return;

    const reset = useFriendshipsStore.getState().reset;

    if (!isAuthenticated || !user?.id) {
      reset();
      return;
    }

    void fetchFriends();
    void fetchPendingRequests();
    void fetchSentRequests();
    void fetchSuggestions();
  }, [
    authInitialized,
    isAuthenticated,
    user?.id,
    fetchFriends,
    fetchPendingRequests,
    fetchSentRequests,
    fetchSuggestions,
  ]);

  // ============================================================================
  // Realtime refresh — ONE shared subscription no matter how many mounts
  // (module-level refcount in friendships.realtime.ts). Replaces the old
  // 15 s polling fallback that ran forever because the socket.io backend is gone.
  // ============================================================================

  useEffect(() => {
    if (!authInitialized || !isAuthenticated || !user?.id) return;
    return acquireFriendshipsRealtime(user.id);
  }, [authInitialized, isAuthenticated, user?.id]);

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // Estado
    friends,
    pendingRequests,
    sentRequests,
    suggestions,
    isLoading,
    error,

    // Stats
    totalFriends,
    closeFriendsCount,
    pendingCount,
    suggestionsCount,

    // Acciones
    fetchFriends,
    fetchPendingRequests,
    fetchSentRequests,
    fetchSuggestions,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    updateFriendConfig,
  };
}
