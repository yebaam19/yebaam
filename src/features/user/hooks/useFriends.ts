import { useState, useCallback, useEffect, useRef } from 'react';
import { friendsService, type Friend, type GetFriendsResponse } from '../services/friends.service';
import { toast } from 'sonner';
import { useSocket } from '@/providers/socket-provider';

/**
 * Hook para gestionar amigos
 */
export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [closeFriends, setCloseFriends] = useState<Friend[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { usersSocket } = useSocket();
  
  // Usar ref para evitar dependencias circulares
  const friendsRef = useRef<Friend[]>([]);

  // Actualizar ref cuando cambia friends
  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);

  // Cargar lista de amigos
  const fetchFriends = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await friendsService.getFriends();
      
      // Asegurar que no haya duplicados por friendId
      const uniqueFriends = data.friends.reduce((acc, friend) => {
        if (!acc.find(f => f.friendId === friend.friendId)) {
          acc.push(friend);
        }
        return acc;
      }, [] as Friend[]);
      
      const uniqueCloseFriends = data.closeFriends.reduce((acc, friend) => {
        if (!acc.find(f => f.friendId === friend.friendId)) {
          acc.push(friend);
        }
        return acc;
      }, [] as Friend[]);
      
      setFriends(uniqueFriends);
      setCloseFriends(uniqueCloseFriends);
      setTotal(uniqueFriends.length);
    } catch (error) {
      setError(error as Error);
      console.error('Error al cargar amigos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Sin dependencias para evitar recreación

  // Marcar/desmarcar como amigo cercano
  const toggleCloseFriend = useCallback(async (friendId: string) => {
    try {
      const result = await friendsService.toggleCloseFriend(friendId);
      
      // Actualizar estado local
      setFriends(prev => 
        prev.map(f => 
          f.friendId === friendId 
            ? { ...f, closeFriend: result.closeFriend }
            : f
        )
      );

      // Actualizar también la lista de amigos cercanos
      setCloseFriends(prev => {
        if (result.closeFriend) {
          // Agregar a amigos cercanos si no existe
          const friend = friendsRef.current.find(f => f.friendId === friendId);
          if (friend && !prev.find(f => f.friendId === friendId)) {
            return [...prev, { ...friend, closeFriend: true }];
          }
        } else {
          // Remover de amigos cercanos
          return prev.filter(f => f.friendId !== friendId);
        }
        return prev;
      });

      if (result.closeFriend) {
        toast.success('Agregado a amigos cercanos');
      } else {
        toast.success('Removido de amigos cercanos');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al actualizar';
      toast.error(message);
      throw error;
    }
  }, []); // Sin dependencias, usa friendsRef

  // Eliminar amigo
  const removeFriend = useCallback(async (friendshipId: string) => {
    try {
      // Buscar información del amigo antes de eliminarlo (usando friendshipId)
      const removedFriend = friendsRef.current.find(f => f.friendshipId === friendshipId);
      
      await friendsService.removeFriend(friendshipId);
      
      const friendName = removedFriend 
        ? `${removedFriend.firstName} ${removedFriend.lastName}` 
        : 'el amigo';
      
      toast.success(`${friendName} ha sido eliminado de tus amigos`, {
        description: 'Ya no verás sus publicaciones en tu feed',
        duration: 5000,
      });
      
      // Actualizar estado local usando friendshipId
      setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
      setCloseFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
      setTotal(prev => prev - 1);
      
      console.log('Amigo eliminado localmente:', friendshipId);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al eliminar amigo';
      toast.error(message);
      throw error;
    }
  }, []); // Sin dependencias, usa friendsRef

  // Escuchar eventos de WebSocket
  useEffect(() => {
    if (!usersSocket) {
      console.log('[useFriends] Socket de usuarios no disponible aún');
      return;
    }



    // Listener: Cuando alguien te elimina de sus amigos
    const handleFriendRemoved = (data: any) => {
      console.log(' [useFriends] Evento friend_removed recibido:', data);
      
      const { removedBy, userProfile } = data;
      
      // Actualizar estado local - eliminar al usuario que te eliminó
      setFriends(prev => prev.filter(f => f.friendId !== removedBy));
      setCloseFriends(prev => prev.filter(f => f.friendId !== removedBy));
      setTotal(prev => Math.max(0, prev - 1));
      
      // Mostrar notificación al usuario
      const userName = userProfile 
        ? `${userProfile.firstName} ${userProfile.lastName}` 
        : 'Un usuario';
      
      toast.error(`${userName} te eliminó de sus amigos`, {
        description: 'Ya no son amigos',
        duration: 8000,
        action: {
          label: 'Ver perfil',
          onClick: () => {
            if (userProfile?.username) {
              window.location.href = `/${userProfile.username}`;
            }
          },
        },
      });
    };

    // Listener: Cuando aceptan tu solicitud de amistad
    const handleFriendRequestAccepted = (data: any) => {

      const acceptorName = data.acceptorProfile 
        ? `${data.acceptorProfile.firstName} ${data.acceptorProfile.lastName}` 
        : 'Un usuario';
      
      toast.success(`${acceptorName} aceptó tu solicitud de amistad`, {
        description: 'Ahora son amigos',
        duration: 5000,
      });
      
      console.log(' [useFriends] Recargando lista de amigos...');
      // Recargar la lista de amigos
      friendsService.getFriends().then(response => {
        const uniqueFriends = response.friends.reduce((acc, friend) => {
          if (!acc.find(f => f.friendId === friend.friendId)) {
            acc.push(friend);
          }
          return acc;
        }, [] as Friend[]);
        
        const uniqueCloseFriends = response.closeFriends.reduce((acc, friend) => {
          if (!acc.find(f => f.friendId === friend.friendId)) {
            acc.push(friend);
          }
          return acc;
        }, [] as Friend[]);
        
        setFriends(uniqueFriends);
        setCloseFriends(uniqueCloseFriends);
        setTotal(uniqueFriends.length);
        

      }).catch(console.error);
    };

    // Registrar listeners
    usersSocket.on('friend_removed', handleFriendRemoved);
    usersSocket.on('friend_request_accepted', handleFriendRequestAccepted);

    // Cleanup
    return () => {
  
      usersSocket.off('friend_removed', handleFriendRemoved);
      usersSocket.off('friend_request_accepted', handleFriendRequestAccepted);
    };
  }, [usersSocket]); // Solo depende de usersSocket

  // Cargar datos iniciales
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return {
    friends,
    closeFriends,
    total,
    isLoading,
    error,
    toggleCloseFriend,
    removeFriend,
    refetch: fetchFriends,
  };
}
