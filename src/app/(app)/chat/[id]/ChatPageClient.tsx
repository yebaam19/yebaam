'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { ConversationType, type Conversation, type MessageMedia } from '@/features/chat/types';
import { useSocket } from '@/providers/socket-provider';
import ChatHeader from '@/components/chat/ChatHeader';
import MessagesList from '@/components/chat/MessagesList';
import ChatInput from '@/components/chat/ChatInput';
import { supabase } from '@/utils/supabase/client';

interface ChatPageClientProps {
  contactId: string;
}

async function applyPeerContactDisplay(
  resolvedConversationId: string,
  meId: string,
  conversationSnapshot: Conversation | null,
): Promise<{ name: string; avatar: string; isOnline: boolean; isEncrypted: boolean }> {
  const fallbackGroup = {
    name: conversationSnapshot?.name?.trim() || 'Chat',
    avatar: conversationSnapshot?.avatar ?? '',
    isOnline: false,
    isEncrypted: Boolean(conversationSnapshot?.isEncrypted),
  };

  let peerUserId: string | null = null;

  if (
    conversationSnapshot?.type === ConversationType.DIRECT &&
    conversationSnapshot.participantIds.length >= 2
  ) {
    peerUserId = conversationSnapshot.participantIds.find((id) => id !== meId) ?? null;
  }

  const { data: partRows, error: partErr } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', resolvedConversationId);

  if (partErr) {
    console.warn('[ChatPageClient] conversation_participants:', partErr.message);
    return fallbackGroup;
  }

  const participantIds = ((partRows ?? []) as { user_id: string }[])
    .map((r) => r.user_id)
    .filter(Boolean);

  if (participantIds.length > 2) {
    const { data: crow } = await supabase
      .from('conversations')
      .select('name, avatar')
      .eq('id', resolvedConversationId)
      .maybeSingle();
    const row = crow as { name: string | null; avatar: string | null } | null;
    return {
      name: row?.name?.trim() || conversationSnapshot?.name?.trim() || 'Chat',
      avatar: row?.avatar || conversationSnapshot?.avatar || '',
      isOnline: false,
      isEncrypted: Boolean(conversationSnapshot?.isEncrypted),
    };
  }

  if (!peerUserId && participantIds.length === 2) {
    peerUserId = participantIds.find((id) => id !== meId) ?? null;
  }

  if (!peerUserId && participantIds.length === 1 && participantIds[0] !== meId) {
    peerUserId = participantIds[0] ?? null;
  }

  if (!peerUserId) {
    return {
      name: fallbackGroup.name,
      avatar: fallbackGroup.avatar,
      isOnline: false,
      isEncrypted: Boolean(conversationSnapshot?.isEncrypted),
    };
  }

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('username, first_name, last_name, avatar_url')
    .eq('id', peerUserId)
    .maybeSingle();

  if (profErr || !profile) {
    const short = peerUserId.slice(0, 8);
    return {
      name: short,
      avatar: '',
      isOnline: false,
      isEncrypted: Boolean(conversationSnapshot?.isEncrypted),
    };
  }

  const row = profile as {
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  const full = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  const displayName = full || (row.username ? `@${row.username}` : peerUserId.slice(0, 8));

  return {
    name: displayName,
    avatar: row.avatar_url ?? '',
    isOnline: false,
    isEncrypted: Boolean(conversationSnapshot?.isEncrypted),
  };
}

export default function ChatPageClient({ contactId }: ChatPageClientProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { chatSocket } = useSocket();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [headerEncrypted, setHeaderEncrypted] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: 'Chat',
    avatar: '',
    isOnline: false,
  });

  useEffect(() => {
    if (!contactId || !user) return;

    const loadConversation = async () => {
      try {
        setIsLoading(true);
        setContactInfo({ name: 'Chat', avatar: '', isOnline: false });
        setHeaderEncrypted(false);

        let resolvedConversationId: string;
        let conversationSnapshot: Conversation | null = null;
        let result: Awaited<ReturnType<typeof chatService.getConversationMessages>>;

        const direct = await chatService.findConversationByParticipant(contactId);
        if (direct) {
          conversationSnapshot = direct;
          resolvedConversationId = direct.id;
          result = await chatService.getConversationMessages(resolvedConversationId, 50, 0);
        } else {
          try {
            result = await chatService.getConversationMessages(contactId, 50, 0);
            resolvedConversationId = contactId;
          } catch {
            const conversation = await chatService.createOrGetConversation(contactId);
            conversationSnapshot = conversation;
            resolvedConversationId = conversation.id;
            result = await chatService.getConversationMessages(resolvedConversationId, 50, 0);
          }
        }

        setConversationId(resolvedConversationId);

        const display = await applyPeerContactDisplay(resolvedConversationId, user.id, conversationSnapshot);
        setContactInfo({
          name: display.name,
          avatar: display.avatar,
          isOnline: display.isOnline,
        });
        setHeaderEncrypted(display.isEncrypted);

        const sortedMessages = [...result.messages].sort(
          (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        setMessages(sortedMessages);

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

  const handleSendMessage = async (content?: string, media?: MessageMedia): Promise<boolean> => {
    if (!conversationId) return false;
    const trimmed = content?.trim();
    if (!trimmed && !media) return false;

    try {
      const sent = await chatService.sendMessage(conversationId, trimmed ?? '', undefined, media);
      setMessages((prev) => (prev.some((m: any) => m?.id === sent.id) ? prev : [...prev, sent]));
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

  const handleTypingStartWs = () => {
    if (chatSocket && conversationId) {
      chatSocket.emit('typing_start', { conversationId });
    }
  };

  const handleTypingStopWs = () => {
    if (chatSocket && conversationId) {
      chatSocket.emit('typing_stop', { conversationId });
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex max-h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] min-h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] w-full min-w-0 flex-col overflow-hidden bg-white dark:bg-neutral-900">
      <ChatHeader
        contactName={contactInfo.name}
        contactAvatar={contactInfo.avatar}
        isOnline={contactInfo.isOnline}
        conversationId={conversationId ?? undefined}
        isEncrypted={headerEncrypted}
        onClose={() => router.back()}
      />

      <MessagesList
        messages={messages}
        isLoading={isLoading}
        isTyping={isTyping}
        currentUserId={user?.id}
        contactAvatar={contactInfo.avatar}
        contactName={contactInfo.name}
      />

      <ChatInput
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStartWs}
        onTypingStop={handleTypingStopWs}
        typingTimeoutRef={{ current: null }}
      />
    </div>
  );
}
