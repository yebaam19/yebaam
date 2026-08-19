import {
  friendshipsService,
  FriendRequestBlockedError,
  type FriendRequest,
  type SendFriendRequestDto,
} from '../../services/friendships.service';
import { toast } from 'sonner';
import type { FriendshipsSet, FriendshipsGet, FriendshipsState } from '../friendships.types';
import { getErrorMessage } from '../friendships.helpers';
import { clearFriendRequestNotification } from '../friendships.notifications';

/**
 * Request-lifecycle actions of the friendships store: send/accept/reject/cancel
 * plus the websocket handlers for each. `acceptFriendRequest`/`rejectFriendRequest`
 * keep their original sequential ordering (fetchFriends → notification cleanup).
 * None of the mutations touch the shared `isLoading` (initial-load flag) —
 * flipping it remounted every `if (isLoading) <skeleton/>` consumer mid-action.
 */
export function createRequestsActions(
  set: FriendshipsSet,
  get: FriendshipsGet
): Pick<
  FriendshipsState,
  | 'sendFriendRequest'
  | 'acceptFriendRequest'
  | 'rejectFriendRequest'
  | 'cancelFriendRequest'
  | 'handleFriendRequestSent'
  | 'handleFriendRequestAccepted'
  | 'handleFriendRequestRejected'
  | 'handleFriendRequestCancelled'
> {
  return {
    /**
     * Enviar solicitud de amistad
     */
    sendFriendRequest: async (data: SendFriendRequestDto) => {
      set({ error: null });
      try {
        const request = await friendshipsService.sendFriendRequest(data);

        //  Eliminar de sugerencias inmediatamente (optimistic update)
        set((state) => ({
          sentRequests: [...state.sentRequests, request],
          suggestions: state.suggestions.filter((s) => s.id !== data.addresseeId),
          suggestionsCount: state.suggestionsCount - 1,
        }));

        toast.success('Solicitud de amistad enviada');
      } catch (error: any) {
        const errorMsg = error?.message || 'Error al enviar solicitud';
        set({ error: errorMsg });

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
      set({ error: null });
      try {
        await friendshipsService.acceptFriendRequest(requestId);

        // Remover de solicitudes pendientes
        set((state) => ({
          pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
          pendingCount: state.pendingCount - 1,
        }));

        // Recargar lista de amigos
        await get().fetchFriends();

        await clearFriendRequestNotification(requestId);

        toast.success('Solicitud aceptada');
      } catch (error) {
        const errorMsg = getErrorMessage(error, 'Error al aceptar solicitud');
        set({ error: errorMsg });
        toast.error(errorMsg);
        throw error;
      }
    },

    /**
     * Rechazar solicitud de amistad
     */
    rejectFriendRequest: async (requestId: string) => {
      set({ error: null });
      try {
        await friendshipsService.rejectFriendRequest(requestId);

        // Remover de solicitudes pendientes
        set((state) => ({
          pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
          pendingCount: state.pendingCount - 1,
        }));

        await clearFriendRequestNotification(requestId);

        toast.success('Solicitud rechazada');
      } catch (error) {
        const errorMsg = getErrorMessage(error, 'Error al rechazar solicitud');
        set({ error: errorMsg });
        toast.error(errorMsg);
        throw error;
      }
    },

    /**
     * Cancelar solicitud de amistad enviada
     */
    cancelFriendRequest: async (requestId: string) => {
      set({ error: null });
      try {
        await friendshipsService.cancelFriendRequest(requestId);

        // Remover de solicitudes enviadas
        set((state) => ({
          sentRequests: state.sentRequests.filter((r) => r.id !== requestId),
        }));

        toast.success('Solicitud cancelada');
      } catch (error) {
        const errorMsg = getErrorMessage(error, 'Error al cancelar solicitud');
        set({ error: errorMsg });
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
  };
}
