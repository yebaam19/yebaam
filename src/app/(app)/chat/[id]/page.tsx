'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { useSocket } from '@/providers/socket-provider';
import ChatHeader from '@/components/chat/ChatHeader';
import MessagesList from '@/components/chat/MessagesList';
import ChatInput from '@/components/chat/ChatInput';
import type { MessageMedia } from '@/features/chat/types';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;
  const user = useAuthStore((state) => state.user);
  const { chatSocket } = useSocket();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: 'Chat',
    avatar: '',
    isOnline: false
  });

  // Cargar conversación y mensajes
  useEffect(() => {
    if (!contactId || !user) return;

    const loadConversation = async () => {
      try {

        setIsLoading(true);

        // The URL `id` may be either a CONVERSATION id (e.g. when entering
        // a club's "Chat público" via /chat/<conversationId>) or a CONTACT
        // user id (legacy 1:1 DM flow). Probe the messages endpoint first:
        // if it succeeds, the viewer already participates in a conversation
        // with that id and we can use it directly. Otherwise fall back to
        // the contact-based find-or-create flow.
        let resolvedConversationId: string;
        let result: Awaited<ReturnType<typeof chatService.getConversationMessages>>;
        try {
          result = await chatService.getConversationMessages(contactId, 50, 0);
          resolvedConversationId = contactId;
        } catch {
          let conversation = await chatService.findConversationByParticipant(contactId);
          if (!conversation) {
            conversation = await chatService.createOrGetConversation(contactId);
          }
          resolvedConversationId = conversation.id;
          result = await chatService.getConversationMessages(resolvedConversationId, 50, 0);
        }

        setConversationId(resolvedConversationId);
        
        console.log(' [CHAT PAGE] Resultado de mensajes:', {
          total: result.total,
          messagesCount: result.messages?.length || 0,
          messages: result.messages
        });

        if (result.messages && result.messages.length > 0) {
          console.log(' [CHAT PAGE] Primer mensaje:', result.messages[0]);
          console.log(' [CHAT PAGE] Estructura del primer mensaje:', {
            id: result.messages[0].id,
            conversationId: result.messages[0].conversationId,
            senderId: result.messages[0].senderId,
            content: result.messages[0].content,
            createdAt: result.messages[0].createdAt
          });
        } else {
          console.log('[CHAT PAGE] No hay mensajes en la conversación');
        }
        
        const sortedMessages = result.messages.sort((a: any, b: any) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });


        setMessages(sortedMessages);

        // Unirse a la conversación por WebSocket
        if (chatSocket) {
          chatSocket.emit('join_conversation', { conversationId: resolvedConversationId });
        }

      } catch (error) {
        console.error('[CHAT PAGE] Error loading conversation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [contactId, user, chatSocket]);

  // Escuchar nuevos mensajes
  useEffect(() => {
    if (!chatSocket || !conversationId) return;

    const handleNewMessage = (data: any) => {
      if (data.conversationId !== conversationId) return;
      const msg = data.message;
      if (!msg?.id) return;
      setMessages((prev) => (prev.some((m: any) => m?.id === msg.id) ? prev : [...prev, msg]));
    };

    const handleTypingStart = (data: any) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = (data: any) => {
      if (data.conversationId === conversationId) {
        setIsTyping(false);
      }
    };

    chatSocket.on('new_message', handleNewMessage);
    chatSocket.on('typing_start', handleTypingStart);
    chatSocket.on('typing_stop', handleTypingStop);

    return () => {
      chatSocket.off('new_message', handleNewMessage);
      chatSocket.off('typing_start', handleTypingStart);
      chatSocket.off('typing_stop', handleTypingStop);
    };
  }, [chatSocket, conversationId, user?.id]);

  // Enviar mensaje. The WebSocket path is unreliable (header may show
  // "Desconectado"); the HTTP route inserts the row, and Supabase's
  // postgres_changes stream broadcasts to subscribers — see chat.service.ts.
  const handleSendMessage = async (content?: string, media?: MessageMedia): Promise<boolean> => {
    if (!conversationId) return false;
    const trimmed = content?.trim();
    if (!trimmed && !media) return false;

    try {
      const sent = await chatService.sendMessage(
        conversationId,
        trimmed ?? '',
        undefined,
        media,
      );
      // Optimistically append so the sender sees their message immediately;
      // the realtime listener will skip dupes when it receives the same id.
      setMessages((prev) => (prev.some((m: any) => m?.id === sent.id) ? prev : [...prev, sent]));
      // Best-effort socket nudge for typing indicators / presence.
      if (chatSocket) {
        try {
          chatSocket.emit('send_message', {
            conversationId,
            content: trimmed || undefined,
            media: media || undefined,
          });
        } catch {}
      }
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  // Emitir typing
  const handleTypingStart = () => {
    if (chatSocket && conversationId) {
      chatSocket.emit('typing_start', { conversationId });
    }
  };

  const handleTypingStop = () => {
    if (chatSocket && conversationId) {
      chatSocket.emit('typing_stop', { conversationId });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex max-h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] min-h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] w-full min-w-0 flex-col overflow-hidden bg-white dark:bg-neutral-900">
      {/* Header */}
      <ChatHeader
        contactName={contactInfo.name}
        contactAvatar={contactInfo.avatar}
        isOnline={contactInfo.isOnline}
        onClose={() => router.back()}
      />

      {/* Messages */}
      <MessagesList
        messages={messages}
        isLoading={isLoading}
        isTyping={isTyping}
        currentUserId={user?.id}
        contactAvatar={contactInfo.avatar}
        contactName={contactInfo.name}
      />

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        typingTimeoutRef={{ current: null }}
      />
    </div>
  );
}
