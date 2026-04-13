'use client';

import { useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { useAuth } from '@/features/auth/context/auth-context';
import { useFriendshipsStore } from '../store/friendships.store';
import type { FriendRequest } from '../services/friendships.service';

/**
 * useFriendships Hook
 * 
 * Hook principal para gestionar amistades con:
 * - Estado global de Zustand
 * - Eventos de WebSocket en tiempo real
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
  const { friendshipsSocket, isFriendshipsConnected } = useSocket();
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
    // WebSocket handlers
    handleFriendRequestSent,
    handleFriendRequestAccepted,
    handleFriendRequestRejected,
    handleFriendRequestCancelled,
    handleFriendAdded,
    handleFriendRemoved,
  } = useFriendshipsStore();

  // ============================================================================
  // WebSocket Listeners
  // ============================================================================

  useEffect(() => {
    if (!friendshipsSocket || !isFriendshipsConnected) return;


    /**
     * friend_request_sent: Nueva solicitud recibida
     */
    const onFriendRequestSent = (data: FriendRequest) => {

      handleFriendRequestSent(data);
    };

    /**
     * friend_request_accepted: Tu solicitud fue aceptada
     */
    const onFriendRequestAccepted = (data: FriendRequest) => {
      console.log('[WS] friend_request_accepted:', data);
      handleFriendRequestAccepted(data);
    };

    /**
     * friend_request_rejected: Tu solicitud fue rechazada
     */
    const onFriendRequestRejected = (data: FriendRequest) => {
      console.log('[WS] friend_request_rejected:', data);
      handleFriendRequestRejected(data);
    };

    /**
     * friend_request_cancelled: Cancelaron una solicitud que te enviaron
     */
    const onFriendRequestCancelled = (data: FriendRequest) => {
      console.log('[WS] friend_request_cancelled:', data);
      handleFriendRequestCancelled(data);
    };

    /**
     * friend_added: Nuevo amigo confirmado
     */
    const onFriendAdded = (data: { userId: string; friendId: string }) => {
      console.log('[WS] friend_added:', data);
      handleFriendAdded(data);
    };

    /**
     * friend_removed: Amigo eliminado
     */
    const onFriendRemoved = (data: { userId: string; friendId: string }) => {
      console.log('[WS] friend_removed:', data);
      handleFriendRemoved(data);
    };

    // Registrar listeners
    friendshipsSocket.on('friend_request_sent', onFriendRequestSent);
    friendshipsSocket.on('friend_request_accepted', onFriendRequestAccepted);
    friendshipsSocket.on('friend_request_rejected', onFriendRequestRejected);
    friendshipsSocket.on('friend_request_cancelled', onFriendRequestCancelled);
    friendshipsSocket.on('friend_added', onFriendAdded);
    friendshipsSocket.on('friend_removed', onFriendRemoved);

    // Cleanup
    return () => {
  
      friendshipsSocket.off('friend_request_sent', onFriendRequestSent);
      friendshipsSocket.off('friend_request_accepted', onFriendRequestAccepted);
      friendshipsSocket.off('friend_request_rejected', onFriendRequestRejected);
      friendshipsSocket.off('friend_request_cancelled', onFriendRequestCancelled);
      friendshipsSocket.off('friend_added', onFriendAdded);
      friendshipsSocket.off('friend_removed', onFriendRemoved);
    };
  }, [
    friendshipsSocket,
    isFriendshipsConnected,
    handleFriendRequestSent,
    handleFriendRequestAccepted,
    handleFriendRequestRejected,
    handleFriendRequestCancelled,
    handleFriendAdded,
    handleFriendRemoved,
  ]);

  // ============================================================================
  // Join friendship room (CRITICAL para recibir eventos)
  // ============================================================================

  useEffect(() => {
    if (!friendshipsSocket || !isFriendshipsConnected || !user?.id) return;


    // Emit join event para unirse a la sala personal
    friendshipsSocket.emit('join_friendship_room', { userId: user.id }, (response: any) => {
      
    });

    return () => {
      console.log(' Leaving friendship room');
    };
  }, [friendshipsSocket, isFriendshipsConnected, user?.id]);

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

  // HTTP polling fallback while realtime WebSocket is dormant
  useEffect(() => {
    if (isFriendshipsConnected) return;
    const interval = setInterval(() => {
      fetchPendingRequests();
      fetchFriends();
    }, 15000);
    return () => clearInterval(interval);
  }, [isFriendshipsConnected, fetchPendingRequests, fetchFriends]);

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

    // WebSocket status
    isConnected: isFriendshipsConnected,
  };
}
