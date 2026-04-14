import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { useChatNotifications } from '@/features/chat/context/chat-notification.context';
import { supabase } from '@/utils/supabase/client';
import { ensureRealtimeConnected } from '@/lib/insforge/realtime';

interface UseChatConversationProps {
  contactId: string;
}

function channelForConversation(conversationId: string): string {
  return `chat:conv:${conversationId}`;
}

export function useChatConversation({ contactId }: UseChatConversationProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const user = useAuthStore((state) => state.user);
  const { markConversationAsOpen, markConversationAsClosed } = useChatNotifications();

  useEffect(() => {
    let isMounted = true;
    let realtimeCleanup: (() => void) | null = null;

    const initializeConversation = async () => {
      try {
        setIsLoadingMessages(true);

        // Step A: resolve the conversation id with a single targeted query.
        let conversation = await chatService.findConversationByParticipant(contactId);
        if (!conversation) {
          conversation = await chatService.createOrGetConversation(contactId);
        }
        if (!isMounted) return;

        const convId = conversation.id;
        setConversationId(convId);
        markConversationAsOpen(convId);

        // Wire the realtime listener BEFORE doing anything async so we never
        // miss a message that arrives while the initial fetch is in flight.
        const handleIncoming = (payload: unknown) => {
          if (!isMounted) return;
          const raw = (payload as { message?: unknown })?.message ?? payload;
          if (!raw || typeof raw !== 'object') return;
          const obj = raw as Record<string, unknown>;
          const incomingConvId =
            (obj.conversationId as string) ??
            (obj.conversation_id as string) ??
            convId;
          if (incomingConvId !== convId) return;

          const incoming = {
            id: obj.id as string,
            conversationId: incomingConvId,
            senderId: (obj.senderId as string) ?? (obj.sender_id as string) ?? '',
            content: (obj.content as string) ?? '',
            media: obj.media ?? null,
            status: (obj.status as string) ?? 'sent',
            replyToId:
              (obj.replyToId as string | null) ?? (obj.reply_to_id as string | null) ?? null,
            isDeleted: Boolean(obj.isDeleted ?? obj.is_deleted),
            createdAt: new Date(
              (obj.createdAt as string) ?? (obj.created_at as string) ?? Date.now(),
            ),
            updatedAt: new Date(
              (obj.updatedAt as string) ??
                (obj.updated_at as string) ??
                (obj.createdAt as string) ??
                (obj.created_at as string) ??
                Date.now(),
            ),
          };
          if (!incoming.id) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
          });
        };

        supabase.realtime.on('message.created', handleIncoming);
        realtimeCleanup = () => supabase.realtime.off('message.created', handleIncoming);

        // Step B: fetch initial messages and connect realtime in parallel.
        const fetchMessages = chatService
          .getConversationMessages(convId, 50, 0)
          .then((result) => {
            if (!isMounted) return;
            const sorted = result.messages.sort(
              (a: any, b: any) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
            // Merge with anything realtime already delivered, preserving dedup.
            setMessages((prev) => {
              if (prev.length === 0) return sorted;
              const seen = new Set(prev.map((m) => m.id));
              const merged = [...prev];
              for (const m of sorted) if (!seen.has(m.id)) merged.push(m);
              return merged.sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              );
            });
            return sorted;
          });

        const subscribeRealtime = ensureRealtimeConnected()
          .then((ok) => {
            if (!ok || !isMounted) return;
            return supabase.realtime.subscribe(channelForConversation(convId));
          })
          .catch((err) => {
            console.warn('[useChatConversation] realtime subscribe failed', err);
          });

        const [sortedMessages] = await Promise.all([fetchMessages, subscribeRealtime]);
        if (!isMounted) return;
        setIsLoadingMessages(false);

        // Mark unread inbound messages as read (best-effort, non-blocking).
        if (sortedMessages && user?.id) {
          const hasUnread = sortedMessages.some(
            (msg: any) => msg.senderId !== user.id && msg.status !== 'read',
          );
          if (hasUnread) {
            void (async () => {
              try {
                await fetch(`/api/conversations/${convId}/read`, {
                  method: 'POST',
                  credentials: 'same-origin',
                });
                await supabase.realtime.publish(
                  channelForConversation(convId),
                  'messages.read',
                  { conversationId: convId, userId: user.id },
                );
              } catch (err) {
                console.warn('[useChatConversation] mark-as-read failed', err);
              }
            })();
          }
        }
      } catch (error) {
        console.error('[useChatConversation] init failed', error);
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    if (contactId && !conversationId && user?.id) {
      initializeConversation();
    }

    return () => {
      isMounted = false;
      if (realtimeCleanup) {
        try {
          realtimeCleanup();
        } catch {}
      }
      if (conversationId) {
        try {
          supabase.realtime.unsubscribe(channelForConversation(conversationId));
        } catch {}
        markConversationAsClosed(conversationId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, user?.id]);

  return {
    conversationId,
    messages,
    setMessages,
    // Public alias kept for backwards compat with existing consumers.
    // The downstream UI also gates on `messages.length === 0`, so the
    // spinner disappears the moment any message (fetch OR realtime) lands.
    isLoading: isLoadingMessages,
  };
}
