import { useState, useMemo, useEffect } from 'react';
import { useChat } from '@/features/chat/hooks/useChat';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { usePresenceStore } from '@/features/presence/store/presence.store';
import { supabase } from '@/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserBasicInfo {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export function useMessengerSidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'inbox' | 'community'>('inbox');
  const [usersMap, setUsersMap] = useState<Map<string, UserBasicInfo>>(new Map());
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  const { conversations, isLoadingConversations, loadConversations } = useChat();
  const { user: currentUser } = useAuthStore();
  const isUserOnlineStore = usePresenceStore(state => state.isUserOnline);

  // Recargar conversaciones cuando se monta el componente
  useEffect(() => {
    console.log(' [useMessengerSidebar] Component mounted, loading conversations...');
    loadConversations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar información de todos los participantes cuando cambien las conversaciones
  useEffect(() => {
    console.log(' [useMessengerSidebar] Conversations changed:', conversations.length);
    if (!conversations || conversations.length === 0 || !currentUser?.id) {
      console.log(' [useMessengerSidebar] No conversations or user, skipping users load');
      return;
    }

    const loadUsersData = async () => {
      setIsLoadingUsers(true);
      try {
        // Obtener todos los IDs únicos de participantes (excluyendo el usuario actual)
        const allParticipantIds = new Set<string>();
        conversations.forEach(conv => {
          // Validar que participantIds existe y es un array
          if (conv && conv.participantIds && Array.isArray(conv.participantIds)) {
            conv.participantIds.forEach(id => {
              if (id && id !== currentUser.id) {
                allParticipantIds.add(id);
              }
            });
          }
        });

        if (allParticipantIds.size === 0) {
          setIsLoadingUsers(false);
          return;
        }

        const userIds = Array.from(allParticipantIds);
        const { data: rows, error } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url')
          .in('id', userIds);

        if (error || !rows) {
          if (error) console.warn('Failed to load participant profiles:', error);
          setIsLoadingUsers(false);
          return;
        }

        const newUsersMap = new Map<string, UserBasicInfo>();
        for (const row of rows) {
          if (!row?.id) continue;
          newUsersMap.set(row.id, {
            id: row.id,
            username: row.username ?? '',
            firstName: row.first_name ?? undefined,
            lastName: row.last_name ?? undefined,
            avatar: row.avatar_url ?? undefined,
          });
        }
        
        setUsersMap(newUsersMap);
      } catch (error) {
        console.error('Error loading users data:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsersData();
  }, [conversations, currentUser?.id]);

  // Helper: Obtener el otro participante (para chats 1-a-1)
  const getOtherParticipantId = (participantIds: string[] | undefined) => {
    if (!participantIds || !Array.isArray(participantIds)) {
      return undefined;
    }
    return participantIds.find(id => id !== currentUser?.id);
  };

  // Helper: Obtener nombre de usuario para mostrar
  const getUserDisplayName = (userId: string | undefined): string => {
    if (!userId) return 'Usuario';
    
    const user = usersMap.get(userId);
    if (!user) return 'Usuario';
    
    // Preferencia: firstName + lastName > username > 'Usuario'
    if (user.firstName) {
      return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
    }
    
    return user.username || 'Usuario';
  };

  // Helper: Obtener avatar de usuario
  const getUserAvatar = (userId: string | undefined, fallbackName: string): string => {
    if (!userId) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random`;
    }
    
    const user = usersMap.get(userId);
    if (user?.avatar) {
      return user.avatar;
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random`;
  };

  // Helper: Verificar si un usuario está online
  const isUserOnline = (userId: string | undefined): boolean => {
    if (!userId) return false;
    return isUserOnlineStore(userId);
  };

  // Helper: Formatear timestamp relativo
  const formatTimestamp = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: false, 
        locale: es 
      });
    } catch {
      return '';
    }
  };

  // Procesar conversaciones para agregar datos derivados
  const processedConversations = useMemo(() => {
    console.log(' [useMessengerSidebar] Processing conversations:', conversations.length);
    console.log(' [useMessengerSidebar] First conversation structure:', conversations[0]);
    console.log(' [useMessengerSidebar] participantIds:', conversations[0]?.participantIds);
    console.log(' [useMessengerSidebar] Is array?:', Array.isArray(conversations[0]?.participantIds));
    
    const processed = conversations
      .filter(conv => {
        const isValid = conv && conv.participantIds && Array.isArray(conv.participantIds);
        if (!isValid) {
          console.warn(' [useMessengerSidebar] Filtering out invalid conversation:', {
            hasConv: !!conv,
            hasParticipantIds: !!conv?.participantIds,
            isArray: Array.isArray(conv?.participantIds),
            conversation: conv,
          });
        }
        return isValid;
      })
      .map(conv => {
        const otherParticipantId = getOtherParticipantId(conv.participantIds);
        
        // Usar datos reales del usuario si están disponibles
        const displayName = conv.name || getUserDisplayName(otherParticipantId);
        const displayAvatar = conv.avatar || getUserAvatar(otherParticipantId, displayName);
        const isOnline = isUserOnline(otherParticipantId);
        
        return {
          ...conv,
          otherParticipantId,
          displayName,
          displayAvatar,
          isOnline,
          formattedTimestamp: conv.lastMessage ? formatTimestamp(conv.lastMessage.createdAt) : '',
        };
      });
    
    console.log(' [useMessengerSidebar] Processed conversations:', processed.length);
    return processed;;
  }, [conversations, currentUser?.id, usersMap, isUserOnlineStore]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtrar conversaciones por búsqueda
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return processedConversations;
    
    return processedConversations.filter(conv => {
      return conv.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [processedConversations, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    conversations: filteredConversations,
    isLoadingConversations: isLoadingConversations || isLoadingUsers,
  };
}
