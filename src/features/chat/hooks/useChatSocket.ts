import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';
import { fetchDecryptedContent, isEncryptedContent } from '../lib/messageCipher';
import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  Message,
  CreateMessageDto,
  MessageReceivedEvent,
  MessagesReadEvent,
  MessageStatus,
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

type DbMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media: unknown;
  status: string;
  reply_to_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

type DbParticipantRow = {
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
};

function rowToMessage(row: DbMessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    media: (row.media ?? null) as Message['media'],
    status: (row.status as MessageStatus) ?? MessageStatus.SENT,
    replyToId: row.reply_to_id,
    isDeleted: Boolean(row.is_deleted),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at ?? row.created_at),
  };
}

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const isIdempotent = method === 'GET' || method === 'HEAD';
  const maxAttempts = isIdempotent ? 4 : 2;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
      });
    } catch (err) {
      const networkError =
        err instanceof Error ? err : new Error('Network error while contacting chat API');
      if (!isIdempotent || attempt === maxAttempts - 1) {
        throw new Error(networkError.message || 'Network error while contacting chat API');
      }
      lastError = networkError;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      continue;
    }

    if (response.ok) {
      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      return payload as T;
    }

    const rawText = await response.text().catch(() => '');
    let parsedError: string | null = null;
    try {
      const json = JSON.parse(rawText) as { error?: string };
      parsedError = json?.error ?? null;
    } catch {
      // not JSON
    }
    const message = parsedError || `Request failed (${response.status})`;
    const retriable =
      response.status === 502 ||
      response.status === 503 ||
      response.status === 504 ||
      /schema cache|recovery mode|bad gateway/i.test(message) ||
      /schema cache|recovery mode|bad gateway/i.test(rawText);
    if (!retriable || attempt === maxAttempts - 1) {
      throw new Error(message);
    }
    lastError = new Error(message);
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  throw lastError ?? new Error('Network request failed');
}

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
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef({ onMessageReceived, onMessagesRead, onError });
  callbacksRef.current = { onMessageReceived, onMessagesRead, onError };

  // Keep a stable Set of the conversation IDs we care about so the realtime
  // handler can filter inbound message rows client-side without recreating
  // the channel every time the list changes.
  const conversationIdSet = useMemo(
    () => new Set(conversations.map((c) => c.id)),
    [conversations],
  );
  const conversationIdSetRef = useRef(conversationIdSet);
  conversationIdSetRef.current = conversationIdSet;

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
    setIsConnected(true);

    return () => {
      unsubscribe(channel);
      setIsConnected(false);
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
