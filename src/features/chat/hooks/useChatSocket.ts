import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { ensureRealtimeConnected } from '@/lib/insforge/realtime';
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

type SocketMessage = {
  meta?: { channel?: string };
  message?: Message;
  conversationId?: string;
  userId?: string;
};

function channelForConversation(conversationId: string): string {
  return `chat:conv:${conversationId}`;
}

function hydrateMessage(raw: unknown): Message | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || typeof obj.conversationId !== 'string') return null;
  return {
    id: obj.id,
    conversationId: obj.conversationId,
    senderId: String(obj.senderId ?? ''),
    content: String(obj.content ?? ''),
    media: (obj.media ?? null) as Message['media'],
    status: (obj.status as MessageStatus) ?? MessageStatus.SENT,
    replyToId: (obj.replyToId as string | null) ?? null,
    isDeleted: Boolean(obj.isDeleted),
    createdAt: new Date(obj.createdAt as string),
    updatedAt: new Date((obj.updatedAt ?? obj.createdAt) as string),
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
        err instanceof Error
          ? err
          : new Error('Network error while contacting chat API');
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
  const [isConnected, setIsConnected] = useState(false);
  const subscribedRef = useRef<Set<string>>(new Set());
  const callbacksRef = useRef({ onMessageReceived, onMessagesRead, onError });

  callbacksRef.current = { onMessageReceived, onMessagesRead, onError };

  // Connect once per authenticated session and wire the generic listeners.
  useEffect(() => {
    if (!currentUserId) return;

    let cancelled = false;

    const handleMessageCreated = (payload: SocketMessage) => {
      const message = hydrateMessage(payload?.message ?? payload);
      const channel = payload?.meta?.channel ?? '';
      const conversationId =
        payload?.conversationId ?? message?.conversationId ?? channel.replace('chat:conv:', '');
      if (!message || !conversationId) return;

      callbacksRef.current.onMessageReceived?.({
        message: { ...message, conversationId },
        conversationId,
      });
    };

    const handleMessagesRead = (payload: SocketMessage) => {
      const channel = payload?.meta?.channel ?? '';
      const conversationId = payload?.conversationId ?? channel.replace('chat:conv:', '');
      const userId = payload?.userId ?? '';
      if (!conversationId) return;
      callbacksRef.current.onMessagesRead?.({ conversationId, userId });
    };

    const handleConnect = () => {
      if (!cancelled) setIsConnected(true);
    };
    const handleDisconnect = () => {
      if (!cancelled) setIsConnected(false);
    };
    const handleError = (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Realtime error';
      callbacksRef.current.onError?.(message);
    };

    supabase.realtime.on('connect', handleConnect);
    supabase.realtime.on('disconnect', handleDisconnect);
    supabase.realtime.on('connect_error', handleError);
    supabase.realtime.on('error', handleError);
    supabase.realtime.on<SocketMessage>('message.created', handleMessageCreated);
    supabase.realtime.on<SocketMessage>('messages.read', handleMessagesRead);

    ensureRealtimeConnected().then((ok) => {
      if (!cancelled) setIsConnected(ok);
    });

    return () => {
      cancelled = true;
      supabase.realtime.off('connect', handleConnect);
      supabase.realtime.off('disconnect', handleDisconnect);
      supabase.realtime.off('connect_error', handleError);
      supabase.realtime.off('error', handleError);
      supabase.realtime.off<SocketMessage>('message.created', handleMessageCreated);
      supabase.realtime.off<SocketMessage>('messages.read', handleMessagesRead);
    };
  }, [currentUserId]);

  // Auto-subscribe to every conversation the user is part of so new messages
  // arrive even for non-active chats (for unread badges / notifications).
  useEffect(() => {
    if (!currentUserId) return;
    const desired = new Set(conversations.map((c) => channelForConversation(c.id)));

    // Subscribe to any new channel
    for (const channel of desired) {
      if (!subscribedRef.current.has(channel)) {
        supabase.realtime
          .subscribe(channel)
          .then(() => subscribedRef.current.add(channel))
          .catch((err) => console.warn('[useChatSocket] subscribe failed', channel, err));
      }
    }

    // Unsubscribe from any channel that's no longer in the list
    for (const channel of Array.from(subscribedRef.current)) {
      if (!desired.has(channel)) {
        supabase.realtime.unsubscribe(channel);
        subscribedRef.current.delete(channel);
      }
    }
  }, [conversations, currentUserId]);

  // Cleanup all subscriptions on unmount.
  useEffect(() => {
    return () => {
      for (const channel of Array.from(subscribedRef.current)) {
        supabase.realtime.unsubscribe(channel);
      }
      subscribedRef.current.clear();
    };
  }, []);

  const joinConversation = useCallback(async (conversationId: string): Promise<void> => {
    const channel = channelForConversation(conversationId);
    if (subscribedRef.current.has(channel)) return;
    try {
      await supabase.realtime.subscribe(channel);
      subscribedRef.current.add(channel);
    } catch (err) {
      console.error('[useChatSocket] joinConversation failed', err);
      throw err instanceof Error ? err : new Error('Failed to join conversation');
    }
  }, []);

  const leaveConversation = useCallback(async (conversationId: string): Promise<void> => {
    const channel = channelForConversation(conversationId);
    // Keep the subscription alive so we still get notifications for this
    // conversation while sitting on another screen — only drop it when the
    // conversation is removed from the user's list (handled by the effect
    // above). This mirrors Facebook Messenger behavior.
    void channel;
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

      const saved = hydrateMessage({
        ...payload.data,
        conversationId,
      });
      if (!saved) return null;

      // Broadcast the created message so other subscribers pick it up.
      try {
        await supabase.realtime.publish(channelForConversation(conversationId), 'message.created', {
          message: saved,
          conversationId,
        });
      } catch (err) {
        console.warn('[useChatSocket] publish failed', err);
      }

      return saved;
    },
    [],
  );

  const markAsRead = useCallback(
    async (conversationId: string): Promise<void> => {
      try {
        await jsonRequest<{ success: true }>(`/api/conversations/${conversationId}/read`, {
          method: 'POST',
        });
      } catch (err) {
        console.warn('[useChatSocket] markAsRead failed', err);
      }

      if (currentUserId) {
        try {
          await supabase.realtime.publish(
            channelForConversation(conversationId),
            'messages.read',
            { conversationId, userId: currentUserId },
          );
        } catch (err) {
          console.warn('[useChatSocket] publish read failed', err);
        }
      }
    },
    [currentUserId],
  );

  return {
    chatSocket: null,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    isConnected,
  };
}
