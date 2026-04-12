import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  friendRequestService, 
  type FriendSuggestion,
  type FriendRequest,
  type GetFriendRequestsResponse 
} from '../services/friend-request.service';
import { toast } from 'sonner';
import { useSocket } from '@/providers/socket-provider';

export function useFriendRequests() {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  
  const [requestsError, setRequestsError] = useState<Error | null>(null);
  const [suggestionsError, setSuggestionsError] = useState<Error | null>(null);

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

  // Cargar sugerencias de amigos
  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoadingSuggestions(true);
      setSuggestionsError(null);
      const data = await friendRequestService.getFriendSuggestions(4);
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      setSuggestionsError(error as Error);
      setSuggestions([]); // Asegurar que siempre sea un array en caso de error
      console.error('Error al cargar sugerencias:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []); 

  // Enviar solicitud de amistad
  const sendRequest = useCallback(async (recipientId: string) => {
    try {
      setIsSending(true);
      
      //  Eliminación optimista: remover de sugerencias inmediatamente
      setSuggestions((prev) => Array.isArray(prev) ? prev.filter((s) => s.id !== recipientId) : []);
      
      const response = await friendRequestService.sendFriendRequest(recipientId);
      toast.success('Solicitud de amistad enviada');
      
      // Recargar datos manualmente para evitar dependencias circulares
      await friendRequestService.getFriendRequests().then(data => {
        setReceivedRequests(data.received);
        setSentRequests(data.sent);
        setTotalRequests(data.total);
      });
      
      // No es necesario recargar sugerencias porque ya las filtramos optimistamente
      // await friendRequestService.getFriendSuggestions(4).then(data => {
      //   setSuggestions(data);
      // });
      
      // RETORNAR la respuesta con requestId
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al enviar solicitud';
      toast.error(message);
      
      //  Si falla, recargar sugerencias para restaurar el estado
      await friendRequestService.getFriendSuggestions(4).then(data => {
        setSuggestions(Array.isArray(data) ? data : []);
      });
      
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
      
      await friendRequestService.getFriendSuggestions(4).then(data => {
        setSuggestions(Array.isArray(data) ? data : []);
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al cancelar solicitud';
      toast.error(message);
      throw error;
    } finally {
      setIsCanceling(false);
    }
  }, []); // Sin dependencias

  // Escuchar eventos de WebSocket en tiempo real
  useEffect(() => {
    if (!usersSocket) {
      console.log('[useFriendRequests] Socket de usuarios no disponible aún');
      return;
    }

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

  // Cargar datos iniciales
  useEffect(() => {
    fetchRequests();
    fetchSuggestions();
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
