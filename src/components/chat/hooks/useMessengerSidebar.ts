import { useState, useMemo, useEffect, useCallback } from 'react';
import { useChat } from '@/features/chat/hooks/useChat';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { usePresenceStore } from '@/features/presence/store/presence.store';
import { useChatStore } from '@/features/chat/store/chat.store';
import { ConversationType } from '@/features/chat/types';
import { supabase } from '@/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/lib/utils/date-fns-locale';

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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const dateLocale = useDateFnsLocale();

  const { conversations, isLoadingConversations } = useChat();
  const { user: currentUser } = useAuthStore();
  const isUserOnlineStore = usePresenceStore(state => state.isUserOnline);
  const resetUnreadCount = useChatStore(state => state.resetUnreadCount);

  // Flip `hasLoadedOnce` once the first fetch completes so subsequent
  // refetches use stale-while-revalidate (no full-screen loader flash).
  // useChat() already triggers loadConversations() on mount; calling it again
  // here would race two requests and double-toggle isLoadingConversations.
  useEffect(() => {
    if (!isLoadingConversations) setHasLoadedOnce(true);
  }, [isLoadingConversations]);

  // Cargar información de todos los participantes cuando cambien las conversaciones
  useEffect(() => {
    if (!conversations || conversations.length === 0 || !currentUser?.id) {
      setIsLoadingUsers(false);
      return;
    }

    // Flip loading on synchronously so the consumer's combined loading flag
    // stays truthy across the gap between "conversations arrived" and "user
    // profiles arrived" — that gap is what causes the avatar/name flicker.
    setIsLoadingUsers(true);

    const loadUsersData = async () => {
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
        locale: dateLocale
      });
    } catch {
      return '';
    }
  };

  // Procesar conversaciones para agregar datos derivados
  const processedConversations = useMemo(() => {
    const processed = conversations
      .filter((conv) => Boolean(conv && conv.participantIds && Array.isArray(conv.participantIds)))
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

    return processed;
  }, [conversations, currentUser?.id, usersMap, isUserOnlineStore]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtrar por tab (Bandejas = directos; Comunidades = grupos)
  const tabFilteredConversations = useMemo(() => {
    return processedConversations.filter((conv) => {
      const type = (conv as { type?: ConversationType }).type;
      const isGroup = type === ConversationType.GROUP;
      return activeTab === 'community' ? isGroup : !isGroup;
    });
  }, [processedConversations, activeTab]);

  // Filtrar conversaciones por búsqueda
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return tabFilteredConversations;

    return tabFilteredConversations.filter(conv => {
      return conv.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [tabFilteredConversations, searchQuery]);

  const hasUnreadInActiveTab = useMemo(
    () => tabFilteredConversations.some((c) => (c.unreadCount ?? 0) > 0),
    [tabFilteredConversations],
  );

  const markAllReadInActiveTab = useCallback(async () => {
    const targets = tabFilteredConversations.filter((c) => (c.unreadCount ?? 0) > 0);
    if (targets.length === 0) return;
    // Optimistic local reset
    targets.forEach((c) => resetUnreadCount(c.id));
    // Best-effort persistence — server marks each conversation as read
    await Promise.allSettled(
      targets.map((c) =>
        fetch(`/api/conversations/${c.id}/read`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
  }, [tabFilteredConversations, resetUnreadCount]);

  return {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    conversations: filteredConversations,
    isLoadingConversations: !hasLoadedOnce && (isLoadingConversations || isLoadingUsers),
    hasUnreadInActiveTab,
    markAllReadInActiveTab,
  };
}
