import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { useChatNotifications } from '@/features/chat/context/chat-notification.context';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';

interface UseChatConversationProps {
  contactId: string;
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
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at ?? row.created_at),
  };
}

export function useChatConversation({ contactId }: UseChatConversationProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const user = useAuthStore((state) => state.user);
  const { markConversationAsOpen, markConversationAsClosed } = useChatNotifications();

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<typeof subscribeToTable> | null = null;

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

        // Subscribe to postgres_changes on the messages table, filtered to
        // this conversation. Supabase delivers INSERTs from other users AND
        // from ourselves — we dedup by id client-side. Kick this off BEFORE
        // fetching history so nothing that lands mid-fetch is lost.
        channel = subscribeToTable<DbMessageRow>({
          channel: `chat:conv:${convId}`,
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
          events: ['INSERT'],
          onChange: (payload) => {
            if (!isMounted) return;
            const row = payload.new as DbMessageRow;
            if (!row?.id) return;
            const incoming = rowToMessage(row);
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              );
            });
          },
        });

        // Step B: fetch initial messages.
        const result = await chatService.getConversationMessages(convId, 50, 0);
        if (!isMounted) return;
        const sorted = result.messages.sort(
          (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        // Merge with anything realtime already delivered, preserving dedup.
        setMessages((prev) => {
          if (prev.length === 0) return sorted;
          const seen = new Set(prev.map((m) => m.id));
          const merged = [...prev];
          for (const m of sorted) if (!seen.has(m.id)) merged.push(m);
          return merged.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        });
        setIsLoadingMessages(false);

        // Mark unread inbound messages as read (best-effort, non-blocking).
        // The /read endpoint updates conversation_participants.last_read_at,
        // which flows to the other participant via postgres_changes on that
        // table. No manual broadcast needed.
        if (user?.id) {
          const hasUnread = sorted.some(
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

    if (contactId && !conversationId && user?.id) {
      initializeConversation();
    }

    return () => {
      isMounted = false;
      unsubscribe(channel);
      if (conversationId) {
        markConversationAsClosed(conversationId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, user?.id]);

  return {
    conversationId,
    messages,
    setMessages,
    isLoading: isLoadingMessages,
  };
}
