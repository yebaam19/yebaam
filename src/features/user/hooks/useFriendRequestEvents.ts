import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { toast } from 'sonner';
import { friendRequestService, type FriendRequest } from '../services/friend-request.service';

type Props = {
  setReceivedRequests: Dispatch<SetStateAction<FriendRequest[]>>;
  setSentRequests: Dispatch<SetStateAction<FriendRequest[]>>;
  setTotalRequests: Dispatch<SetStateAction<number>>;
};

export function useFriendRequestEvents({ setReceivedRequests, setSentRequests, setTotalRequests }: Props) {
  const { usersSocket } = useSocket();
  // Escuchar eventos de WebSocket en tiempo real
  useEffect(() => {
    if (!usersSocket) return;

    // Listener: Nueva solicitud de amistad recibida
    const handleFriendRequestReceived = (data: { senderProfile?: FriendRequest['profile'] }) => {

      
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
    const handleFriendRequestAccepted = (data: { requestId: string }) => {

      
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
  }, [usersSocket, setReceivedRequests, setSentRequests, setTotalRequests]); // Solo depende de usersSocket

}
