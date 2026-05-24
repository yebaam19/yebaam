import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  friendshipsService,
  FriendRequestBlockedError,
  type Friend,
  type FriendRequest,
  type FriendSuggestion,
  type SendFriendRequestDto,
  type UpdateFriendConfigDto,
} from '../services/friendships.service';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface FriendshipsState {
  // Estado
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  suggestions: FriendSuggestion[];
  isLoading: boolean;
  isInitialized: boolean; // Nuevo: indica si ya se cargaron los datos iniciales
  error: string | null;

  // Stats
  totalFriends: number;
  closeFriendsCount: number;
  pendingCount: number;
  suggestionsCount: number;

  // Acciones - API Calls
  initializeFriendships: () => Promise<void>; // Nuevo: carga todos los datos iniciales
  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  fetchSuggestions: (limit?: number) => Promise<void>;
  sendFriendRequest: (data: SendFriendRequestDto) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  updateFriendConfig: (friendId: string, config: UpdateFriendConfigDto) => Promise<void>;

  // Acciones - WebSocket Events
  handleFriendRequestSent: (request: FriendRequest) => void;
  handleFriendRequestAccepted: (request: FriendRequest) => void;
  handleFriendRequestRejected: (request: FriendRequest) => void;
  handleFriendRequestCancelled: (request: FriendRequest) => void;
  handleFriendAdded: (data: { userId: string; friendId: string }) => void;
  handleFriendRemoved: (data: { userId: string; friendId: string }) => void;

  // Utilidades
  getFriendshipStatus: (userId: string) => 'friends' | 'pending-sent' | 'pending-received' | 'none';
  reset: () => void;
}

export const useFriendshipsStore = create<FriendshipsState>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      friends: [],
      pendingRequests: [],
      sentRequests: [],
      suggestions: [],
      isLoading: false,
      isInitialized: false,
      error: null,
      totalFriends: 0,
      closeFriendsCount: 0,
      pendingCount: 0,
      suggestionsCount: 0,

      /**
       * Inicializa todos los datos de friendships de una vez
       * Esta función debe ser llamada al cargar la aplicación
       */
      initializeFriendships: async () => {
        // Si ya está inicializado, no hacer nada
        if (get().isInitialized) {
     
          return;
        }

        set({ isLoading: true, error: null });
        try {
     
          // Cargar todo en paralelo
          const [friendsData, pendingData, sentData] = await Promise.all([
            friendshipsService.getFriends(),
            friendshipsService.getPendingRequests(),
            friendshipsService.getSentRequests(),
          ]);

          set({
            friends: friendsData.friends,
            totalFriends: friendsData.count,
            closeFriendsCount: friendsData.closeFriendsCount,
            pendingRequests: pendingData.requests,
            pendingCount: pendingData.count,
            sentRequests: sentData.requests,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
;
        } catch (error) {
    
          const errorMsg = error instanceof Error ? error.message : 'Error al cargar datos de amistad';
          set({ error: errorMsg, isLoading: false, isInitialized: true }); // Marcar como inicializado incluso con error
        }
      },

    
      fetchFriends: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await friendshipsService.getFriends();
          set({
            friends: data.friends,
            totalFriends: data.count,
            closeFriendsCount: data.closeFriendsCount,
            isLoading: false,
            isInitialized: true, // Marcar como inicializado
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al cargar amigos';
          set({ error: errorMsg, isLoading: false });
          toast.error(errorMsg);
        }
      },

      /**
       * Obtener solicitudes pendientes
       */
      fetchPendingRequests: async () => {
   
        set({ isLoading: true, error: null });
        try {
          const data = await friendshipsService.getPendingRequests();
       
          
          set({
            pendingRequests: data.requests,
            pendingCount: data.count,
            isLoading: false,
            isInitialized: true, // Marcar como inicializado
          });
     

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al cargar solicitudes';
          set({ error: errorMsg, isLoading: false });
          toast.error(errorMsg);
        }
      },

      /**
       * Obtener solicitudes enviadas
       */
      fetchSentRequests: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await friendshipsService.getSentRequests();
          set({
            sentRequests: data.requests,
            isLoading: false,
            isInitialized: true, // Marcar como inicializado
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al cargar solicitudes enviadas';
          set({ error: errorMsg, isLoading: false });
          toast.error(errorMsg);
        }
      },

      /**
       * Obtener sugerencias de amigos
       */
      fetchSuggestions: async (limit: number = 10) => {
        set({ isLoading: true, error: null });
        try {
          const suggestions = await friendshipsService.getFriendSuggestions(limit);
          set({
            suggestions,
            suggestionsCount: suggestions.length,
            isLoading: false,
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al cargar sugerencias';
          set({ error: errorMsg, isLoading: false });
          toast.error(errorMsg);
        }
      },

      /**
       * Enviar solicitud de amistad
       */
      sendFriendRequest: async (data: SendFriendRequestDto) => {
        set({ isLoading: true, error: null });
        try {
          const request = await friendshipsService.sendFriendRequest(data);
          
          //  Eliminar de sugerencias inmediatamente (optimistic update)
          set((state) => ({
            sentRequests: [...state.sentRequests, request],
            suggestions: state.suggestions.filter((s) => s.id !== data.addresseeId),
            suggestionsCount: state.suggestionsCount - 1,
            isLoading: false,
          }));

          toast.success('Solicitud de amistad enviada');
        } catch (error: any) {
          const errorMsg = error?.message || 'Error al enviar solicitud';
          set({ error: errorMsg, isLoading: false });

          if (error instanceof FriendRequestBlockedError) {
            switch (error.reason) {
              case 'hourly_limit':
              case 'daily_limit':
              case 'weekly_limit':
              case 'new_account_daily_limit':
                toast.warning(error.message, { duration: 6000 });
                break;
              case 'frozen':
                toast.error(error.message, { duration: 8000 });
                break;
              case 'already_pending':
                toast.warning('Ya enviaste una solicitud a este usuario');
                break;
              case 'already_friends':
                toast.info('Ya son amigos');
                break;
              case 'blocked':
              case 'invalid_addressee':
              case 'unauthenticated':
              default:
                toast.error(error.message);
            }
          } else if (errorMsg.includes('Ya existe una solicitud pendiente')) {
            toast.warning('Ya enviaste una solicitud a este usuario');
          } else if (errorMsg.includes('Ya son amigos')) {
            toast.info('Ya son amigos');
          } else {
            toast.error(errorMsg);
          }

          throw error;
        }
      },

      /**
       * Aceptar solicitud de amistad
       */
      acceptFriendRequest: async (requestId: string) => {
        set({ isLoading: true, error: null });
        try {
          await friendshipsService.acceptFriendRequest(requestId);

          // Remover de solicitudes pendientes
          set((state) => ({
            pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
            pendingCount: state.pendingCount - 1,
            isLoading: false,
          }));

          // Recargar lista de amigos
          await get().fetchFriends();

          // 🔔 Eliminar la notificación asociada del notification store
          const { useNotificationStore } = await import('@/features/notification/store/notification.store');
          const { NotificationType } = await import('@/features/notification/interfaces/notification.interfaces');
          
          const notificationStore = useNotificationStore.getState();
          const friendRequestNotification = notificationStore.notifications.find(
            n => n.type === NotificationType.FRIEND_REQUEST && 
                 n.targetUrl?.includes(requestId)
          );

          if (friendRequestNotification) {
            notificationStore.removeNotificationFromList(friendRequestNotification.id);
            
            // Actualizar contador de no leídas
            if (!friendRequestNotification.isRead) {
              const currentCount = notificationStore.unreadCount;
              useNotificationStore.setState({ unreadCount: Math.max(0, currentCount - 1) });
            }
          }

          toast.success('Solicitud aceptada');
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al aceptar solicitud';
          set({ error: errorMsg, isLoading: false });
          toast.error(errorMsg);
          throw error;
        }
      },

      /**
       * Rechazar solicitud de amistad
       */
      rejectFriendRequest: async (requestId: string) => {
        set({ isLoading: true, error: null });
        try {
          await friendshipsService.rejectFriendRequest(requestId);

          // Remover de solicitudes pendientes
          set((state) => ({
            pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
            pendingCount: state.pendingCount - 1,
            isLoading: false,
          }));

          // 🔔 Eliminar la notificación asociada del notification store
          const { useNotificationStore } = await import('@/features/notification/store/notification.store');
          const { NotificationType } = await import('@/features/notification/interfaces/notification.interfaces');
          
          const notificationStore = useNotificationStore.getState();
          const friendRequestNotification = notificationStore.notifications.find(
            n => n.type === NotificationType.FRIEND_REQUEST && 
                 n.targetUrl?.includes(requestId)
          );

          if (friendRequestNotification) {
            notificationStore.removeNotificationFromList(friendRequestNotification.id);
            
            // Actualizar contador de no leídas
            if (!friendRequestNotification.isRead) {
              const currentCount = notificationStore.unreadCount;
              useNotificationStore.setState({ unreadCount: Math.max(0, currentCount - 1) });
            }
          }

          toast.success('Solicitud rechazada');
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al rechazar solicitud';
          set({ error: errorMsg, isLoading: false });
          toast.error(errorMsg);
          throw error;
        }
      },

      /**
       * Cancelar solicitud de amistad enviada
       */
      cancelFriendRequest: async (requestId: string) => {
        set({ isLoading: true, error: null });
        try {
          await friendshipsService.cancelFriendRequest(requestId);

          // Remover de solicitudes enviadas
          set((state) => ({
            sentRequests: state.sentRequests.filter((r) => r.id !== requestId),
            isLoading: false,
          }));

          toast.success('Solicitud cancelada');
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al cancelar solicitud';
          set({ error: errorMsg, isLoading: false });
          toast.error(errorMsg);
          throw error;
        }
      },

      /**
       * Eliminar un amigo
       * @param friendshipId - ID de la relación de amistad
       */
      removeFriend: async (friendshipId: string) => {
        set({ isLoading: true, error: null });
        try {
          await friendshipsService.removeFriend(friendshipId);

          // Remover de lista de amigos usando friendshipId
          set((state) => {
            const friend = state.friends.find((f) => f.friendshipId === friendshipId);
            const wasCloseFriend = friend?.closeFriend || false;

            return {
              friends: state.friends.filter((f) => f.friendshipId !== friendshipId),
              totalFriends: state.totalFriends - 1,
              closeFriendsCount: wasCloseFriend
                ? state.closeFriendsCount - 1
                : state.closeFriendsCount,
              isLoading: false,
            };
          });

          toast.success('Amigo eliminado');
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al eliminar amigo';
          set({ error: errorMsg, isLoading: false });
          toast.error(errorMsg);
          throw error;
        }
      },

      /**
       * Actualizar configuración de un amigo
       */
      updateFriendConfig: async (friendId: string, config: UpdateFriendConfigDto) => {
        set({ isLoading: true, error: null });
        try {
          const updatedFriend = await friendshipsService.updateFriendConfig(friendId, config);

          // Actualizar en estado local
          set((state) => ({
            friends: state.friends.map((f) =>
              f.friendId === friendId ? { ...f, ...updatedFriend } : f
            ),
            closeFriendsCount:
              config.closeFriend !== undefined
                ? config.closeFriend
                  ? state.closeFriendsCount + 1
                  : state.closeFriendsCount - 1
                : state.closeFriendsCount,
            isLoading: false,
          }));

          if (config.closeFriend !== undefined) {
            toast.success(
              config.closeFriend ? 'Agregado a amigos cercanos' : 'Removido de amigos cercanos'
            );
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al actualizar configuración';
          set({ error: errorMsg, isLoading: false });
          toast.error(errorMsg);
          throw error;
        }
      },

      // ========================================================================
      // WEBSOCKET EVENT HANDLERS
      // ========================================================================

      /**
       * Evento: Nueva solicitud de amistad recibida
       */
      handleFriendRequestSent: (request: FriendRequest) => {
        set((state) => ({
          pendingRequests: [...state.pendingRequests, request],
          pendingCount: state.pendingCount + 1,
        }));

        toast.info('Nueva solicitud de amistad recibida', {
          duration: 5000,
        });
      },

      /**
       * Evento: Solicitud de amistad aceptada
       */
      handleFriendRequestAccepted: (request: FriendRequest) => {
        // Remover de solicitudes enviadas
        set((state) => ({
          sentRequests: state.sentRequests.filter((r) => r.id !== request.id),
        }));

        // Recargar lista de amigos
        get().fetchFriends();

        toast.success('Tu solicitud de amistad fue aceptada', {
          duration: 5000,
        });
      },

      /**
       * Evento: Solicitud de amistad rechazada
       */
      handleFriendRequestRejected: (request: FriendRequest) => {
        // Remover de solicitudes enviadas
        set((state) => ({
          sentRequests: state.sentRequests.filter((r) => r.id !== request.id),
        }));

        toast.error('Tu solicitud de amistad fue rechazada', {
          duration: 5000,
        });
      },

      /**
       * Evento: Solicitud de amistad cancelada
       */
      handleFriendRequestCancelled: (request: FriendRequest) => {
        // Remover de solicitudes pendientes
        set((state) => ({
          pendingRequests: state.pendingRequests.filter((r) => r.id !== request.id),
          pendingCount: state.pendingCount - 1,
        }));

        toast.info('Una solicitud de amistad fue cancelada');
      },

      /**
       * Evento: Nuevo amigo agregado
       */
      handleFriendAdded: (data: { userId: string; friendId: string }) => {
        // Recargar lista de amigos
        get().fetchFriends();

        toast.success('¡Ahora son amigos!', {
          duration: 5000,
        });
      },

      /**
       * Evento: Amigo eliminado
       */
      handleFriendRemoved: (data: { userId: string; friendId: string }) => {
        // Remover de lista de amigos
        set((state) => {
          const friend = state.friends.find((f) => f.friendId === data.friendId);
          const wasCloseFriend = friend?.closeFriend || false;

          return {
            friends: state.friends.filter((f) => f.friendId !== data.friendId),
            totalFriends: state.totalFriends - 1,
            closeFriendsCount: wasCloseFriend
              ? state.closeFriendsCount - 1
              : state.closeFriendsCount,
          };
        });

        toast.info('Un amigo fue eliminado');
      },

      // ========================================================================
      // UTILIDADES
      // ========================================================================

      /**
       * Obtener estado de amistad con un usuario específico
       */
      getFriendshipStatus: (userId: string) => {
        const state = get();

        if (state.friends.some(f => f.friendId === userId)) return 'friends';

        const sentRequest = state.sentRequests.find(r => r.addresseeId === userId && r.status === 'pending');
        if (sentRequest) return 'pending-sent';

        const receivedRequest = state.pendingRequests.find(r => r.requesterId === userId && r.status === 'pending');
        if (receivedRequest) return 'pending-received';

        return 'none';
      },

      /**
       * Resetear estado
       */
      reset: () => {
        set({
          friends: [],
          pendingRequests: [],
          sentRequests: [],
          suggestions: [],
          isLoading: false,
          isInitialized: false,
          error: null,
          totalFriends: 0,
          closeFriendsCount: 0,
          pendingCount: 0,
          suggestionsCount: 0,
        });
      },
    }),
    { name: 'Friendships Store' }
  )
);
