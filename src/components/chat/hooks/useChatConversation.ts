import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { useChatNotifications } from '@/features/chat/context/chat-notification.context';
import { conversationCache } from '@/features/chat/lib/conversation-cache';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';

interface UseChatConversationProps {
  contactId: string;
  /**
   * Explicit conversation id. Set for group bubbles (no single peer to resolve);
   * when provided we skip the peer-id → conversation resolution entirely.
   */
  conversationId?: string;
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
  edited_at: string | null;
  created_at: string;
  updated_at: string;
};

function rowToMessage(row: DbMessageRow) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    media: row.media ?? null,
    status: row.status ?? 'sent',
    replyToId: row.reply_to_id,
    isDeleted: Boolean(row.is_deleted),
    editedAt: row.edited_at ?? null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at ?? row.created_at),
  };
}

const byCreatedAt = (a: any, b: any) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

/** Merge two message lists by id (dedup), keeping chronological order. */
function mergeMessages(prev: any[], incoming: any[]): any[] {
  if (prev.length === 0) return [...incoming].sort(byCreatedAt);
  const seen = new Set(prev.map((m) => m.id));
  const merged = [...prev];
  for (const m of incoming) if (!seen.has(m.id)) merged.push(m);
  return merged.sort(byCreatedAt);
}

/**
 * Loads + lives an open chat conversation. Messenger-style fast path: if we've
 * already opened this thread this session, render the cached conversation id +
 * messages instantly (no spinner) and revalidate in the background. Cold opens
 * still resolve + fetch, but the conversation-id cache (primed from the loaded
 * conversation list) usually lets us skip the resolve round-trips.
 */
export function useChatConversation({ contactId, conversationId: explicitConvId }: UseChatConversationProps) {
  const cachedConvId = explicitConvId ?? conversationCache.getConvId(contactId);
  const cachedMessages = cachedConvId ? conversationCache.getMessages(cachedConvId) : null;

  const [conversationId, setConversationId] = useState<string | null>(cachedConvId);
  const [messages, setMessages] = useState<any[]>(cachedMessages ?? []);
  // Only show the spinner when we have nothing to paint yet.
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(
    !(cachedMessages && cachedMessages.length > 0),
  );

  const user = useAuthStore((state) => state.user);
  const { markConversationAsOpen, markConversationAsClosed } = useChatNotifications();

  useEffect(() => {
    if (!contactId || !user?.id) return;
    let isMounted = true;
    let channel: ReturnType<typeof subscribeToTable> | null = null;
    let openedConvId: string | null = null;

    const run = async () => {
      try {
        // Step A: resolve the conversation id. Group bubbles pass it explicitly;
        // direct bubbles resolve it from cache, else over the network (the cache
        // is primed from the conversation list, so this usually costs zero trips).
        let convId = explicitConvId ?? conversationCache.getConvId(contactId);
        if (!convId) {
          let conversation = await chatService.findConversationByParticipant(contactId);
          if (!conversation) {
            conversation = await chatService.createOrGetConversation(contactId);
          }
          if (!isMounted) return;
          convId = conversation.id;
          conversationCache.setConvId(contactId, convId);
        }
        if (!isMounted) return;

        openedConvId = convId;
        setConversationId(convId);
        markConversationAsOpen(convId);

        // Subscribe BEFORE fetching so nothing that lands mid-fetch is lost.
        channel = subscribeToTable<DbMessageRow>({
          channel: `chat:conv:${convId}`,
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
          events: ['INSERT', 'UPDATE'],
          onChange: (payload) => {
            if (!isMounted) return;
            const row = payload.new as DbMessageRow;
            if (!row?.id) return;
            const incoming = rowToMessage(row);
            // UPDATE (edit / soft-delete) → replace in place; INSERT → append.
            setMessages((prev) => {
              const idx = prev.findIndex((m) => m.id === incoming.id);
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = incoming;
                return next;
              }
              return mergeMessages(prev, [incoming]);
            });
          },
        });

        // Step B: revalidate history. If we already painted cached messages,
        // this happens silently behind them (stale-while-revalidate).
        const result = await chatService.getConversationMessages(convId, 50, 0);
        if (!isMounted) return;
        setMessages((prev) => mergeMessages(prev, result.messages));
        setIsLoadingMessages(false);

        // Mark unread inbound as read (best-effort, non-blocking).
        if (user?.id) {
          const hasUnread = result.messages.some(
            (msg: any) => msg.senderId !== user.id && msg.status !== 'read',
          );
          if (hasUnread) {
            void fetch(`/api/conversations/${convId}/read`, {
              method: 'POST',
              credentials: 'same-origin',
            }).catch((err) => console.warn('[useChatConversation] mark-as-read failed', err));
          }
        }
      } catch (error) {
        console.error('[useChatConversation] init failed', error);
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    run();

    return () => {
      isMounted = false;
      unsubscribe(channel);
      if (openedConvId) markConversationAsClosed(openedConvId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, explicitConvId, user?.id]);

  // Keep the cache warm with the latest rendered thread so the next open of
  // this conversation paints instantly.
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      conversationCache.setMessages(conversationId, messages);
    }
  }, [conversationId, messages]);

  return {
    conversationId,
    messages,
    setMessages,
    isLoading: isLoadingMessages,
  };
}
