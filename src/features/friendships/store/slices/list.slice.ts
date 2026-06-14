import {
  friendshipsService,
  type UpdateFriendConfigDto,
} from '../../services/friendships.service';
import { toast } from 'sonner';
import type { FriendshipsSet, FriendshipsGet, FriendshipsState } from '../friendships.types';
import { getErrorMessage, removeFriendFromList } from '../friendships.helpers';

/**
 * List/friends-side actions of the friendships store: initial load, the
 * individual fetchers, suggestions, per-friend config, removal, and the
 * friend-added/removed websocket handlers. Bodies are preserved verbatim from
 * the original monolithic store (the in-place `Promise.all` is kept).
 */
export function createListActions(
  set: FriendshipsSet,
  get: FriendshipsGet
): Pick<
  FriendshipsState,
  | 'initializeFriendships'
  | 'fetchFriends'
  | 'fetchPendingRequests'
  | 'fetchSentRequests'
  | 'fetchSuggestions'
  | 'updateFriendConfig'
  | 'removeFriend'
  | 'handleFriendAdded'
  | 'handleFriendRemoved'
> {
  return {
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

        const errorMsg = getErrorMessage(error, 'Error al cargar datos de amistad');
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
        const errorMsg = getErrorMessage(error, 'Error al cargar amigos');
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
        const errorMsg = getErrorMessage(error, 'Error al cargar solicitudes');
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
        const errorMsg = getErrorMessage(error, 'Error al cargar solicitudes enviadas');
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
        const errorMsg = getErrorMessage(error, 'Error al cargar sugerencias');
        set({ error: errorMsg, isLoading: false });
        toast.error(errorMsg);
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
        set((state) => ({
          ...removeFriendFromList(state, (f) => f.friendshipId === friendshipId),
          isLoading: false,
        }));

        toast.success('Amigo eliminado');
      } catch (error) {
        const errorMsg = getErrorMessage(error, 'Error al eliminar amigo');
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
        const errorMsg = getErrorMessage(error, 'Error al actualizar configuración');
        set({ error: errorMsg, isLoading: false });
        toast.error(errorMsg);
        throw error;
      }
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
      set((state) => removeFriendFromList(state, (f) => f.friendId === data.friendId));

      toast.info('Un amigo fue eliminado');
    },
  };
}
