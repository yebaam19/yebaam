'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { cacheKey, invalidate, updateCached } from '@/lib/hooks/cacheStore';
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
    [...pageMessagesKeys.conversations(), pageId, JSON.stringify(query ?? {})] as const,
  messages: () => [...pageMessagesKeys.all, 'messages'] as const,
  messagesList: (pageId: string, conversationId: string, query?: GetMessagesQuery) =>
    [...pageMessagesKeys.messages(), pageId, conversationId, JSON.stringify(query ?? {})] as const,
};

type CachedRecord<T> = { data: T; fetchedAt: number };

export function usePageConversations(
  pageId: string | undefined,
  query?: GetConversationsQuery,
) {
  return useFetch(
    pageMessagesKeys.conversationsList(pageId!, query),
    () => pageMessagesService.getPageConversations(pageId!, query),
    { enabled: !!pageId, staleTime: 30000 }
  );
}

export function useConversationMessages(
  pageId: string | undefined,
  conversationId: string | undefined,
  query?: GetMessagesQuery,
) {
  return useFetch(
    pageMessagesKeys.messagesList(pageId!, conversationId!, query),
    () => pageMessagesService.getConversationMessages(pageId!, conversationId!, query),
    { enabled: !!pageId && !!conversationId, staleTime: 10000 }
  );
}

/**
 * Hook para infinite scroll de mensajes.
 * TODO: pagination — original used useInfiniteQuery; only first page returned now.
 */
export function useInfiniteConversationMessages(
  pageId: string | undefined,
  conversationId: string | undefined,
  limit = 50,
) {
  return useFetch(
    pageMessagesKeys.messagesList(pageId!, conversationId!, { limit }),
    () =>
      pageMessagesService.getConversationMessages(pageId!, conversationId!, {
        page: 1,
        limit,
      }),
    { enabled: !!pageId && !!conversationId, staleTime: 10000 }
  );
}

export function useSendMessageToPage(pageId: string) {
  return useAsyncAction(
    (message: SendMessageDto) =>
      pageMessagesService.sendMessageToPage(pageId, message),
    {
      onSuccess: (newMessage: PageMessage) => {
        invalidate(`page-messages::messages::${pageId}::${newMessage.conversationId}`);
        invalidate('page-messages::conversations');

        const key = cacheKey(
          'page-messages',
          'messages',
          pageId,
          newMessage.conversationId,
          JSON.stringify({})
        );
        updateCached<CachedRecord<{ messages: PageMessage[]; total: number }>>(
          key,
          (record) => {
            const old = record?.data;
            if (!old) return { data: { messages: [newMessage], total: 1 }, fetchedAt: Date.now() };
            return {
              data: { messages: [...old.messages, newMessage], total: old.total + 1 },
              fetchedAt: Date.now(),
            };
          }
        );

        toast.success('Mensaje enviado');
      },
      onError: (error: any) => {
        console.error('Error sending message:', error);
        toast.error('Error al enviar el mensaje');
      },
    }
  );
}

export function useSendMessageAsPage(pageId: string) {
  return useAsyncAction(
    (message: SendMessageDto) =>
      pageMessagesService.sendMessageAsPage(pageId, message),
    {
      onSuccess: (newMessage: PageMessage) => {
        invalidate(`page-messages::messages::${pageId}::${newMessage.conversationId}`);
        invalidate('page-messages::conversations');

        const key = cacheKey(
          'page-messages',
          'messages',
          pageId,
          newMessage.conversationId,
          JSON.stringify({})
        );
        updateCached<CachedRecord<{ messages: PageMessage[]; total: number }>>(
          key,
          (record) => {
            const old = record?.data;
            if (!old) return { data: { messages: [newMessage], total: 1 }, fetchedAt: Date.now() };
            return {
              data: { messages: [...old.messages, newMessage], total: old.total + 1 },
              fetchedAt: Date.now(),
            };
          }
        );

        toast.success('Respuesta enviada');
      },
      onError: (error: any) => {
        console.error('Error sending message as page:', error);
        toast.error('Error al enviar la respuesta');
      },
    }
  );
}

export function useMarkMessagesAsRead(pageId: string, conversationId: string) {
  return useAsyncAction(
    () => pageMessagesService.markMessagesAsRead(pageId, conversationId),
    {
      onSuccess: () => {
        invalidate(`page-messages::messages::${pageId}::${conversationId}`);
        invalidate('page-messages::conversations');
      },
      onError: (error: any) => {
        console.error('Error marking messages as read:', error);
      },
    }
  );
}

export function useUpdateConversationOnNewMessage() {
  return (pageId: string, conversationId: string, message: PageMessage) => {
    const convKey = cacheKey('page-messages', 'conversations', pageId, JSON.stringify({}));
    updateCached<CachedRecord<{ conversations: PageConversation[]; total: number }>>(
      convKey,
      (record) => {
        const old = record?.data;
        if (!old) return record!;
        return {
          data: {
            ...old,
            conversations: old.conversations.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    lastMessage: message.message.substring(0, 100),
                    lastMessageAt: message.createdAt,
                    lastMessageSenderId: message.senderId,
                    unreadCount:
                      message.senderType === 'user' ? conv.unreadCount + 1 : conv.unreadCount,
                  }
                : conv
            ),
          },
          fetchedAt: Date.now(),
        };
      }
    );

    const msgKey = cacheKey(
      'page-messages',
      'messages',
      pageId,
      conversationId,
      JSON.stringify({})
    );
    updateCached<CachedRecord<{ messages: PageMessage[]; total: number }>>(msgKey, (record) => {
      const old = record?.data;
      if (!old) return record!;
      const exists = old.messages.some((m) => m.id === message.id);
      if (exists) return record!;
      return {
        data: { messages: [...old.messages, message], total: old.total + 1 },
        fetchedAt: Date.now(),
      };
    });
  };
}
