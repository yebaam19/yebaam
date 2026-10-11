import { rowToMessage, type DbMessageRow } from '../lib/messageRows';
import { jsonRequest } from '../lib/chatJsonRequest';
import { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';
import { fetchDecryptedContent, isEncryptedContent } from '../lib/messageCipher';
import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  Message,
  CreateMessageDto,
  MessageReceivedEvent,
  MessagesReadEvent,
} from '../types';

interface UseChatSocketProps {
  onMessageReceived?: (event: MessageReceivedEvent) => void;
  onMessagesRead?: (event: MessagesReadEvent) => void;
  onError?: (error: string) => void;
}

interface UseChatSocketReturn {
  chatSocket: null;
  joinConversation: (conversationId: string) => Promise<void>;
  leaveConversation: (conversationId: string) => Promise<void>;
  sendMessage: (messageData: CreateMessageDto) => Promise<Message | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  isConnected: boolean;
}

type DbParticipantRow = {
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
};

export function useChatSocket({
  onMessageReceived,
  onMessagesRead,
  onError,
}: UseChatSocketProps = {}): UseChatSocketReturn {
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const conversations = useChatStore((state) => state.conversations);
  // Per-hook-instance nonce so two components mounting useChat() at once
  // don't collide on the same realtime topic — @supabase/realtime-js reuses
  // an existing channel when topics match, and calling .on('postgres_changes')
  // on an already-joined channel throws.
  const instanceId = useId();
  // Supabase's realtime connection is per-channel and lazy; we treat the
  // socket as "connected" for UI purposes as long as we have a channel.
  const isConnected = Boolean(currentUserId);
  const callbacksRef = useRef({ onMessageReceived, onMessagesRead, onError });
  useEffect(() => {
    callbacksRef.current = { onMessageReceived, onMessagesRead, onError };
  }, [onMessageReceived, onMessagesRead, onError]);

  // Keep a stable Set of the conversation IDs we care about so the realtime
  // handler can filter inbound message rows client-side without recreating
  // the channel every time the list changes.
  const conversationIdSet = useMemo(
    () => new Set(conversations.map((c) => c.id)),
    [conversations],
  );
  const conversationIdSetRef = useRef(conversationIdSet);
  useEffect(() => {
    conversationIdSetRef.current = conversationIdSet;
  }, [conversationIdSet]);

  // One channel on the `messages` table listens for new messages across
  // every conversation the user is a participant in. We could also filter
  // by conversation_id=in.(...) but Supabase realtime filters only support
  // eq; client-side membership check is fine since RLS already guarantees
  // we only see our own rows.
  useEffect(() => {
    if (!currentUserId) return;

    const channel = subscribeToTable<DbMessageRow>({
      channel: `chat:user:${currentUserId}:messages:${instanceId}`,
      table: 'messages',
      events: ['INSERT'],
      onChange: (payload) => {
        const row = payload.new as DbMessageRow;
        if (!row?.id) return;
        if (!conversationIdSetRef.current.has(row.conversation_id)) return;
        // Private-chat rows arrive as ciphertext — resolve the plaintext
        // (inbox previews / unread toasts render it) before dispatching.
        if (isEncryptedContent(row.content)) {
          void fetchDecryptedContent(row.conversation_id, row.id).then((plain) => {
            if (plain === null) return;
            callbacksRef.current.onMessageReceived?.({
              message: rowToMessage({ ...row, content: plain }),
              conversationId: row.conversation_id,
            });
          });
          return;
        }
        callbacksRef.current.onMessageReceived?.({
          message: rowToMessage(row),
          conversationId: row.conversation_id,
        });
      },
    });

    return () => {
      unsubscribe(channel);
    };
  }, [currentUserId, instanceId]);

  // Separate channel for the read-receipt signal: a user's last_read_at on a
  // conversation_participants row bumps forward whenever they mark messages
  // as read. Every other participant sees the UPDATE via postgres_changes
  // and can advance their own "read" state.
  useEffect(() => {
    if (!currentUserId) return;

    const channel = subscribeToTable<DbParticipantRow>({
      channel: `chat:user:${currentUserId}:reads:${instanceId}`,
      table: 'conversation_participants',
      events: ['UPDATE'],
      onChange: (payload) => {
        const row = payload.new as DbParticipantRow;
        if (!row?.conversation_id || !row.user_id) return;
        if (!conversationIdSetRef.current.has(row.conversation_id)) return;
        callbacksRef.current.onMessagesRead?.({
          conversationId: row.conversation_id,
          userId: row.user_id,
        });
      },
    });

    return () => {
      unsubscribe(channel);
    };
  }, [currentUserId, instanceId]);

  const joinConversation = useCallback(async (_conversationId: string): Promise<void> => {
    // No-op: the global channel above already covers every conversation the
    // user is in. Kept so call sites don't have to branch on the backend.
    void _conversationId;
  }, []);

  const leaveConversation = useCallback(async (_conversationId: string): Promise<void> => {
    // No-op: we keep the global subscription alive for unread badges, just
    // like Facebook Messenger.
    void _conversationId;
  }, []);

  const sendMessage = useCallback(
    async (messageData: CreateMessageDto): Promise<Message | null> => {
      const { conversationId, content, media, replyToId } = messageData;
      const payload = await jsonRequest<{ data: Message }>(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content, media, replyToId }),
        },
      );
      if (!payload?.data?.id) return null;
      // No manual publish — the INSERT the API just performed broadcasts
      // via postgres_changes on its own.
      return { ...payload.data, conversationId } as Message;
    },
    [],
  );

  const markAsRead = useCallback(async (conversationId: string): Promise<void> => {
    try {
      await jsonRequest<{ success: true }>(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('[useChatSocket] markAsRead failed', err);
    }
    // No manual publish — the /read route updates the participant's
    // last_read_at column, which streams to the other participant via
    // postgres_changes on conversation_participants.
  }, []);

  return {
    chatSocket: null,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    isConnected,
  };
}
