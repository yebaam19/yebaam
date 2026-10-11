import { useState, useEffect } from 'react';
import type { ChatMessage } from '@/features/chat/types';
import { rowToMessage, mergeMessages, type DbMessageRow } from '@/features/chat/lib/messageRows';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { useChatNotifications } from '@/features/chat/context/chat-notification.context';
import { conversationCache } from '@/features/chat/lib/conversation-cache';
import { fetchDecryptedContent, isEncryptedContent } from '@/features/chat/lib/messageCipher';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';

interface UseChatConversationProps {
  contactId: string;
  /**
   * Explicit conversation id. Set for group bubbles (no single peer to resolve);
   * when provided we skip the peer-id → conversation resolution entirely.
   */
  conversationId?: string;
}

/**
 * Loads + lives an open chat conversation. Messenger-style fast path: if we've
 * already opened this thread this session, render the cached conversation id +
 * messages instantly (no spinner) and revalidate in the background. Cold opens
 * still resolve + fetch, but the conversation-id cache (primed from the loaded
 * conversation list) usually lets us skip the resolve round-trips.
 */
export function useChatConversation({ contactId, conversationId: explicitConvId }: UseChatConversationProps) {
  const user = useAuthStore((state) => state.user);
  const identity = `${user?.id}:${explicitConvId ?? contactId}`;
  const [loadedIdentity, setLoadedIdentity] = useState(identity);
  const cachedConvId = explicitConvId ?? conversationCache.getConvId(contactId);
  const cachedMessages = cachedConvId ? conversationCache.getMessages(cachedConvId) : null;

  const [conversationId, setConversationId] = useState<string | null>(cachedConvId);
  const [messages, setMessages] = useState<ChatMessage[]>(cachedMessages ?? []);
  // Only show the spinner when we have nothing to paint yet.
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(
    cachedMessages === null,
  );

  const { markConversationAsOpen, markConversationAsClosed } = useChatNotifications();

  useEffect(() => {
    setLoadedIdentity(identity);
    const initialId = explicitConvId ?? conversationCache.getConvId(contactId);
    const initialMessages = initialId ? conversationCache.getMessages(initialId) : null;
    setConversationId(initialId);
    setMessages(initialMessages ?? []);
    setIsLoadingMessages(initialMessages === null);
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
            // UPDATE (edit / soft-delete) → replace in place; INSERT → append.
            const applyIncoming = (incoming: ReturnType<typeof rowToMessage>) => {
              setMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === incoming.id);
                if (idx !== -1) {
                  const next = [...prev];
                  next[idx] = incoming;
                  return next;
                }
                return mergeMessages(prev, [incoming]);
              });
            };
            // Private-chat rows arrive as ciphertext — resolve the plaintext
            // through the membership-gated single-message endpoint first.
            if (isEncryptedContent(row.content)) {
              void fetchDecryptedContent(row.conversation_id, row.id).then((plain) => {
                if (!isMounted || plain === null) return;
                applyIncoming(rowToMessage({ ...row, content: plain }));
              });
              return;
            }
            applyIncoming(rowToMessage(row));
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
            (msg) => msg.senderId !== user.id && msg.status !== 'read',
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
  }, [contactId, explicitConvId, user?.id, identity]);

  // Keep the cache warm with the latest rendered thread so the next open of
  // this conversation paints instantly.
  useEffect(() => {
    if (conversationId && !isLoadingMessages && loadedIdentity === identity) {
      conversationCache.setMessages(conversationId, messages);
    }
  }, [conversationId, messages, isLoadingMessages, loadedIdentity, identity]);

  return {
    conversationId: loadedIdentity === identity ? conversationId : null,
    messages: loadedIdentity === identity ? messages : [],
    setMessages,
    isLoading: loadedIdentity !== identity || isLoadingMessages,
  };
}
