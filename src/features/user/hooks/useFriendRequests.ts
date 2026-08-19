import { useState, useCallback, useEffect } from 'react';
import {
  friendRequestService,
  type FriendSuggestion,
  type FriendRequest,
} from '../services/friend-request.service';
import { FriendRequestBlockedError } from '@/features/friendships/services/friendships.service';
import { useFriendshipsStore } from '@/features/friendships/store/friendships.store';
import { toast } from 'sonner';
import { useSocket } from '@/providers/socket-provider';

export function useFriendRequests() {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);

  // Suggestions come from the shared friendships store (one friend_suggestions
  // RPC per session, limit 10, fired by useFriendships()); consumers slice to
  // the count they need. Issuing our own RPC here bypassed the store's
  // in-flight guard and tripled the call on /feed.
  const suggestions: FriendSuggestion[] = useFriendshipsStore((s) => s.suggestions);
  const storeLoading = useFriendshipsStore((s) => s.isLoading);
  const storeFetchSuggestions = useFriendshipsStore((s) => s.fetchSuggestions);
  const isLoadingSuggestions = storeLoading && suggestions.length === 0;
  const suggestionsError: Error | null = null;

  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  
  const [requestsError, setRequestsError] = useState<Error | null>(null);

  // Obtener socket de usuarios para eventos en tiempo real
  const { usersSocket } = useSocket();

  // Cargar solicitudes de amistad
  const fetchRequests = useCallback(async () => {
    try {
      setIsLoadingRequests(true);
      setRequestsError(null);
      const data = await friendRequestService.getFriendRequests();
      setReceivedRequests(data.received);
      setSentRequests(data.sent);
      setTotalRequests(data.total);
    } catch (error) {
      setRequestsError(error as Error);
      console.error('Error al cargar solicitudes:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []); 

  // Cargar sugerencias de amigos (delegado al store; el guard in-flight dedupe)
  const fetchSuggestions = useCallback(async () => {
    await storeFetchSuggestions();
  }, [storeFetchSuggestions]);

  // Enviar solicitud de amistad
  const sendRequest = useCallback(async (recipientId: string) => {
    try {
      setIsSending(true);

      const response = await friendRequestService.sendFriendRequest(recipientId);
      toast.success('Solicitud de amistad enviada');

      // Remover de las sugerencias compartidas del store
      useFriendshipsStore.setState((state) => ({
        suggestions: state.suggestions.filter((s) => s.id !== recipientId),
        suggestionsCount: Math.max(0, state.suggestionsCount - 1),
      }));
      
      // Recargar datos manualmente para evitar dependencias circulares
      await friendRequestService.getFriendRequests().then(data => {
        setReceivedRequests(data.received);
        setSentRequests(data.sent);
        setTotalRequests(data.total);
      });
      
      // RETORNAR la respuesta con requestId
      return response;
    } catch (error: any) {
      if (error instanceof FriendRequestBlockedError) {
        const isQuota =
          error.reason === 'hourly_limit' ||
          error.reason === 'daily_limit' ||
          error.reason === 'weekly_limit' ||
          error.reason === 'new_account_daily_limit';
        if (isQuota) {
          toast.warning(error.message, { duration: 6000 });
        } else if (error.reason === 'frozen') {
          toast.error(error.message, { duration: 8000 });
        } else if (error.reason === 'already_pending') {
          toast.warning('Ya enviaste una solicitud a este usuario');
        } else if (error.reason === 'already_friends') {
          toast.info('Ya son amigos');
        } else {
          toast.error(error.message);
        }
      } else {
        const message = error?.message || error?.response?.data?.message || 'Error al enviar solicitud';
        toast.error(message);
      }

      throw error;
    } finally {
      setIsSending(false);
    }
  }, []); // Sin dependencias

  // Aceptar solicitud
  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      setIsAccepting(true);
   
      
      await friendRequestService.acceptFriendRequest(requestId);
   
      await friendRequestService.getFriendRequests().then(data => {
       
        setReceivedRequests(data.received);
        setSentRequests(data.sent);
        setTotalRequests(data.total);

      });
    } catch (error: any) {
     
      const message = error.response?.data?.message || 'Error al aceptar solicitud';
      toast.error(message);
      throw error;
    } finally {
      setIsAccepting(false);
      
    }
  }, []); // Sin dependencias

  // Rechazar solicitud
  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      setIsRejecting(true);
      await friendRequestService.rejectFriendRequest(requestId);
      toast.success('Solicitud rechazada');
      
      // Recargar solicitudes manualmente
      await friendRequestService.getFriendRequests().then(data => {
        setReceivedRequests(data.received);
        setSentRequests(data.sent);
        setTotalRequests(data.total);
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al rechazar solicitud';
      toast.error(message);
      throw error;
    } finally {
      setIsRejecting(false);
    }
  }, []); // Sin dependencias

  // Cancelar solicitud enviada
  const cancelRequest = useCallback(async (requestId: string) => {
    try {
      setIsCanceling(true);
      await friendRequestService.cancelFriendRequest(requestId);
      toast.success('Solicitud cancelada');
      
      // Recargar datos manualmente
      await friendRequestService.getFriendRequests().then(data => {
        setReceivedRequests(data.received);
        setSentRequests(data.sent);
        setTotalRequests(data.total);
      });
      
      // The cancelled person may become a suggestion again
      await storeFetchSuggestions();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al cancelar solicitud';
      toast.error(message);
      throw error;
    } finally {
      setIsCanceling(false);
    }
  }, [storeFetchSuggestions]);

  // Escuchar eventos de WebSocket en tiempo real
  useEffect(() => {
    if (!usersSocket) return;

    // Listener: Nueva solicitud de amistad recibida
    const handleFriendRequestReceived = (data: any) => {

      
      // Actualizar el contador y la lista
      setTotalRequests(prev => prev + 1);
      
      // Recargar solicitudes para tener datos frescos
      friendRequestService.getFriendRequests().then(response => {
        setReceivedRequests(response.received);
        setSentRequests(response.sent);
        setTotalRequests(response.total);
   
      }).catch(console.error);
      console.log('Nueva solicitud de amistad recibida por WebSocket:', data);
      
      // Mostrar notificación
      const senderName = data.senderProfile 
        ? `${data.senderProfile.firstName} ${data.senderProfile.lastName}` 
        : 'Alguien';
      
      toast.info(`${senderName} te envió una solicitud de amistad`, {
        duration: 5000,
      });
    };

    // Listener: Solicitud aceptada (cuando alguien acepta tu solicitud)
    const handleFriendRequestAccepted = (data: any) => {

      
      // Actualizar estado - remover de solicitudes enviadas
      setSentRequests(prev => {
        const filtered = prev.filter(req => req.requestId !== data.requestId);
    
        return filtered;
      });
      
      setTotalRequests(prev => {
        const newTotal = Math.max(0, prev - 1);
   
        return newTotal;
      });
      
      // Recargar para estar seguros
      friendRequestService.getFriendRequests().then(response => {
        setReceivedRequests(response.received);
        setSentRequests(response.sent);
        setTotalRequests(response.total);
      
      }).catch(console.error);
    };

    // Registrar listeners
    usersSocket.on('friend_request_received', handleFriendRequestReceived);
    usersSocket.on('friend_request_accepted', handleFriendRequestAccepted);


    // Cleanup
    return () => {

      usersSocket.off('friend_request_received', handleFriendRequestReceived);
      usersSocket.off('friend_request_accepted', handleFriendRequestAccepted);
    };
  }, [usersSocket]); // Solo depende de usersSocket

  // Cargar datos iniciales. Suggestions only if the store hasn't got them yet
  // (useFriendships() in the app-shell rail normally loads them first; a
  // concurrent call collapses into the store's in-flight promise).
  useEffect(() => {
    fetchRequests();
    if (useFriendshipsStore.getState().suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [fetchRequests, fetchSuggestions]);

  return {
    // Solicitudes recibidas
    receivedRequests,
    
    // Solicitudes enviadas
    sentRequests,
    
    // Total de solicitudes
    totalRequests,
    
    // Sugerencias de amigos
    suggestions,
    
    // Estados de carga
    isLoadingRequests,
    isLoadingSuggestions,
    
    // Errores
    requestsError,
    suggestionsError,
    
    // Acciones
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    
    // Recargar datos
    refetchRequests: fetchRequests,
    refetchSuggestions: fetchSuggestions,
    
    // Estados de carga de mutaciones
    isSending,
    isAccepting,
    isRejecting,
    isCanceling,
  };
}
