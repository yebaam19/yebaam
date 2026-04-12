import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { pageMessagesService } from '../services/page-messages.service';
import type {
  PageMessage,
  SendMessageDto,
  GetMessagesQuery,
} from '../interfaces/page-message.interface';
import type {
  PageConversation,
  GetConversationsQuery,
} from '../interfaces/page-conversation.interface';
import { toast } from 'sonner';

// Query Keys
export const pageMessagesKeys = {
  all: ['page-messages'] as const,
  conversations: () => [...pageMessagesKeys.all, 'conversations'] as const,
  conversationsList: (pageId: string, query?: GetConversationsQuery) =>
    [...pageMessagesKeys.conversations(), pageId, query] as const,
  messages: () => [...pageMessagesKeys.all, 'messages'] as const,
  messagesList: (pageId: string, conversationId: string, query?: GetMessagesQuery) =>
    [...pageMessagesKeys.messages(), pageId, conversationId, query] as const,
};

/**
 * Hook para obtener conversaciones de una página (inbox)
 */
export function usePageConversations(
  pageId: string | undefined,
  query?: GetConversationsQuery,
) {
  return useQuery({
    queryKey: pageMessagesKeys.conversationsList(pageId!, query),
    queryFn: () => pageMessagesService.getPageConversations(pageId!, query),
    enabled: !!pageId,
    staleTime: 30000, // 30 segundos
  });
}

/**
 * Hook para obtener mensajes de una conversación con paginación simple
 */
export function useConversationMessages(
  pageId: string | undefined,
  conversationId: string | undefined,
  query?: GetMessagesQuery,
) {
  return useQuery({
    queryKey: pageMessagesKeys.messagesList(pageId!, conversationId!, query),
    queryFn: () =>
      pageMessagesService.getConversationMessages(pageId!, conversationId!, query),
    enabled: !!pageId && !!conversationId,
    staleTime: 10000, // 10 segundos
  });
}

/**
 * Hook para infinite scroll de mensajes
 * Útil para cargar mensajes más antiguos al hacer scroll hacia arriba
 */
export function useInfiniteConversationMessages(
  pageId: string | undefined,
  conversationId: string | undefined,
  limit = 50,
) {
  return useInfiniteQuery({
    queryKey: pageMessagesKeys.messagesList(pageId!, conversationId!, { limit }),
    queryFn: ({ pageParam }) =>
      pageMessagesService.getConversationMessages(pageId!, conversationId!, {
        page: pageParam as number,
        limit,
      }),
    enabled: !!pageId && !!conversationId,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.messages.length, 0);
      return totalFetched < lastPage.total ? allPages.length + 1 : undefined;
    },
    staleTime: 10000,
  });
}

/**
 * Hook para enviar mensaje a una página (como usuario)
 */
export function useSendMessageToPage(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: SendMessageDto) =>
      pageMessagesService.sendMessageToPage(pageId, message),
    onSuccess: (newMessage: PageMessage) => {
      // Invalidar queries de mensajes de la conversación
      queryClient.invalidateQueries({
        queryKey: pageMessagesKeys.messagesList(pageId, newMessage.conversationId),
      });

      // Invalidar conversaciones para actualizar lastMessage
      queryClient.invalidateQueries({
        queryKey: pageMessagesKeys.conversations(),
      });

      // Optimistic update: agregar mensaje inmediatamente
      queryClient.setQueryData<{ messages: PageMessage[]; total: number }>(
        pageMessagesKeys.messagesList(pageId, newMessage.conversationId, {}),
        (old) => {
          if (!old) return { messages: [newMessage], total: 1 };
          return {
            messages: [...old.messages, newMessage],
            total: old.total + 1,
          };
        },
      );

      toast.success('Mensaje enviado');
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
    },
  });
}

/**
 * Hook para enviar mensaje como página (responder a usuario)
 */
export function useSendMessageAsPage(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: SendMessageDto) =>
      pageMessagesService.sendMessageAsPage(pageId, message),
    onSuccess: (newMessage: PageMessage) => {
      // Invalidar queries de mensajes
      queryClient.invalidateQueries({
        queryKey: pageMessagesKeys.messagesList(pageId, newMessage.conversationId),
      });

      // Invalidar conversaciones
      queryClient.invalidateQueries({
        queryKey: pageMessagesKeys.conversations(),
      });

      // Optimistic update
      queryClient.setQueryData<{ messages: PageMessage[]; total: number }>(
        pageMessagesKeys.messagesList(pageId, newMessage.conversationId, {}),
        (old) => {
          if (!old) return { messages: [newMessage], total: 1 };
          return {
            messages: [...old.messages, newMessage],
            total: old.total + 1,
          };
        },
      );

      toast.success('Respuesta enviada');
    },
    onError: (error: any) => {
      console.error('Error sending message as page:', error);
      toast.error('Error al enviar la respuesta');
    },
  });
}

/**
 * Hook para marcar mensajes como leídos
 */
export function useMarkMessagesAsRead(pageId: string, conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      pageMessagesService.markMessagesAsRead(pageId, conversationId),
    onSuccess: () => {
      // Invalidar mensajes para actualizar el estado isRead
      queryClient.invalidateQueries({
        queryKey: pageMessagesKeys.messagesList(pageId, conversationId),
      });

      // Invalidar conversaciones para actualizar unreadCount
      queryClient.invalidateQueries({
        queryKey: pageMessagesKeys.conversations(),
      });
    },
    onError: (error: any) => {
      console.error('Error marking messages as read:', error);
    },
  });
}

/**
 * Helper para actualizar conversaciones en caché cuando llega un nuevo mensaje via WebSocket
 */
export function useUpdateConversationOnNewMessage() {
  const queryClient = useQueryClient();

  return (pageId: string, conversationId: string, message: PageMessage) => {
    // Actualizar lista de conversaciones
    queryClient.setQueryData<{ conversations: PageConversation[]; total: number }>(
      pageMessagesKeys.conversationsList(pageId, {}),
      (old) => {
        if (!old) return old;
        
        return {
          ...old,
          conversations: old.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  lastMessage: message.message.substring(0, 100),
                  lastMessageAt: message.createdAt,
                  lastMessageSenderId: message.senderId,
                  unreadCount: message.senderType === 'user' ? conv.unreadCount + 1 : conv.unreadCount,
                }
              : conv
          ),
        };
      }
    );

    // Agregar mensaje a la lista de mensajes si está en caché
    queryClient.setQueryData<{ messages: PageMessage[]; total: number }>(
      pageMessagesKeys.messagesList(pageId, conversationId, {}),
      (old) => {
        if (!old) return old;
        
        // Evitar duplicados
        const messageExists = old.messages.some((m) => m.id === message.id);
        if (messageExists) return old;

        return {
          messages: [...old.messages, message],
          total: old.total + 1,
        };
      }
    );
  };
}
