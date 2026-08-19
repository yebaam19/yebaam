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
  // Per-action in-flight guards: RightSidebar mounts useFriendships() in several
  // widgets (and React StrictMode double-invokes effects in dev), so identical
  // reads fan out (the 8x friend_settings + duplicate suggestions seen on /feed).
  // Each holder collapses concurrent calls to the SAME action into one request.
  // Intentionally PER-ACTION, never a shared isLoading flag — these run in
  // parallel (initializeFriendships uses Promise.all) and a shared guard would
  // make them cancel each other and drop pending/sent/suggestions data.
  //
  // `isLoading` is an INITIAL-load flag: fetchers only raise it while the store
  // is not yet initialized. Later refreshes (realtime, remounts, post-mutation)
  // are silent so consumers that render `if (isLoading) <skeleton/>` don't
  // flash. Mutations never touch it — they surface progress locally.
  let friendsP: Promise<void> | null = null;
  let pendingP: Promise<void> | null = null;
  let sentP: Promise<void> | null = null;
  let suggP: Promise<void> | null = null;
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
      if (friendsP) return friendsP;
      friendsP = (async () => {
      set({ isLoading: !get().isInitialized, error: null });
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
      })();
      try { await friendsP; } finally { friendsP = null; }
    },

    /**
     * Obtener solicitudes pendientes
     */
    fetchPendingRequests: async () => {
      if (pendingP) return pendingP;
      pendingP = (async () => {
      set({ isLoading: !get().isInitialized, error: null });
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
      })();
      try { await pendingP; } finally { pendingP = null; }
    },

    /**
     * Obtener solicitudes enviadas
     */
    fetchSentRequests: async () => {
      if (sentP) return sentP;
      sentP = (async () => {
      set({ isLoading: !get().isInitialized, error: null });
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
      })();
      try { await sentP; } finally { sentP = null; }
    },

    /**
     * Obtener sugerencias de amigos
     */
    fetchSuggestions: async (limit: number = 10) => {
      if (suggP) return suggP;
      suggP = (async () => {
      set({ isLoading: !get().isInitialized, error: null });
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
      })();
      try { await suggP; } finally { suggP = null; }
    },

    /**
     * Eliminar un amigo
     * @param friendshipId - ID de la relación de amistad
     */
    removeFriend: async (friendshipId: string) => {
      set({ error: null });
      try {
        await friendshipsService.removeFriend(friendshipId);

        // Remover de lista de amigos usando friendshipId
        set((state) => removeFriendFromList(state, (f) => f.friendshipId === friendshipId));

        toast.success('Amigo eliminado');
      } catch (error) {
        const errorMsg = getErrorMessage(error, 'Error al eliminar amigo');
        set({ error: errorMsg });
        toast.error(errorMsg);
        throw error;
      }
    },

    /**
     * Actualizar configuración de un amigo
     */
    updateFriendConfig: async (friendId: string, config: UpdateFriendConfigDto) => {
      set({ error: null });
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
        }));

        if (config.closeFriend !== undefined) {
          toast.success(
            config.closeFriend ? 'Agregado a amigos cercanos' : 'Removido de amigos cercanos'
          );
        }
      } catch (error) {
        const errorMsg = getErrorMessage(error, 'Error al actualizar configuración');
        set({ error: errorMsg });
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
