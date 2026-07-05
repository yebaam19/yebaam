'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import NewMessageDialog from '@/components/chat/NewMessageDialog';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { type Conversation, type MessageMedia } from '@/features/chat/types';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';
import { fetchDecryptedContent, isEncryptedContent } from '@/features/chat/lib/messageCipher';
import { loadConversationDisplay, type ParticipantDisplay } from '@/features/chat/lib/conversationDisplay';
import InboxPanel from './_components/InboxPanel';
import ConversationPane from './_components/ConversationPane';

interface ChatPageClientProps {
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

const byCreatedAt = (a: { createdAt: Date | string }, b: { createdAt: Date | string }) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

/** Merge two message lists by id (dedup), keeping chronological order. */
function mergeMessages(prev: any[], incoming: any[]): any[] {
  if (prev.length === 0) return [...incoming].sort(byCreatedAt);
  const seen = new Set(prev.map((m) => m.id));
  const merged = [...prev];
  for (const m of incoming) if (!seen.has(m.id)) merged.push(m);
  return merged.sort(byCreatedAt);
}

export default function ChatPageClient({ contactId }: ChatPageClientProps) {
  const router = useRouter();
  const t = useTranslations('chat');
  const user = useAuthStore((state) => state.user);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [headerEncrypted, setHeaderEncrypted] = useState(false);
  const [peerUserId, setPeerUserId] = useState<string | null>(null);
  const [isGroup, setIsGroup] = useState(false);
  const [participants, setParticipants] = useState<ParticipantDisplay[]>([]);
  const [inboxDrawerOpen, setInboxDrawerOpen] = useState(false);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: t('conversation.fallbackName'),
    avatar: '',
    isOnline: false,
  });

  const handleSelectConversation = useCallback(
    (chat: { id: string }) => {
      setInboxDrawerOpen(false);
      router.push(`/chat/${chat.id}` as Route);
    },
    [router],
  );

  useEffect(() => {
    if (!contactId || !user) return;

    let isMounted = true;
    let channel: ReturnType<typeof subscribeToTable> | null = null;

    const loadConversation = async () => {
      try {
        setIsLoading(true);
        setContactInfo({ name: t('conversation.fallbackName'), avatar: '', isOnline: false });
        setHeaderEncrypted(false);
        setPeerUserId(null);
        setIsGroup(false);
        setParticipants([]);

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

        if (!isMounted) return;
        setConversationId(resolvedConversationId);

        // Subscribe BEFORE painting so a message landing mid-load isn't lost.
        // (Replaces the old socket.io path — `chatSocket` is dead, so the full
        // page had no live delivery; group threads depend on this.)
        channel = subscribeToTable<DbMessageRow>({
          channel: `chat:conv:${resolvedConversationId}`,
          table: 'messages',
          filter: `conversation_id=eq.${resolvedConversationId}`,
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

        const display = await loadConversationDisplay(resolvedConversationId, user.id, conversationSnapshot);
        if (!isMounted) return;
        setContactInfo({ name: display.name, avatar: display.avatar, isOnline: display.isOnline });
        setHeaderEncrypted(display.isEncrypted);
        setPeerUserId(display.peerUserId);
        setIsGroup(display.isGroup);
        setParticipants(display.participants);

        setMessages((prev) => mergeMessages(prev, result.messages));

        // Best-effort mark-as-read (non-blocking).
        void fetch(`/api/conversations/${resolvedConversationId}/read`, {
          method: 'POST',
          credentials: 'same-origin',
        }).catch(() => {});
      } catch (error) {
        console.error('[CHAT PAGE] Error loading conversation:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadConversation();

    return () => {
      isMounted = false;
      unsubscribe(channel);
    };
  }, [contactId, user, t]);

  const handleSendMessage = async (content?: string, media?: MessageMedia): Promise<boolean> => {
    if (!conversationId) return false;
    const trimmed = content?.trim();
    if (!trimmed && !media) return false;

    try {
      const sent = await chatService.sendMessage(conversationId, trimmed ?? '', undefined, media);
      setMessages((prev) => (prev.some((m: any) => m?.id === sent.id) ? prev : mergeMessages(prev, [sent])));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed || !conversationId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, content: trimmed, editedAt: new Date().toISOString() } : m)),
    );
    try {
      await chatService.editMessage(conversationId, messageId, trimmed);
    } catch {
      toast.error(t('message.editFailed'));
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!conversationId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true, content: '', media: null } : m)),
    );
    try {
      await chatService.deleteMessage(conversationId, messageId);
    } catch {
      toast.error(t('message.deleteFailed'));
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
    <div className="relative flex h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] min-h-0 w-full bg-neutral-50 dark:bg-neutral-950">
      <InboxPanel
        conversationId={conversationId}
        inboxDrawerOpen={inboxDrawerOpen}
        onCloseDrawer={() => setInboxDrawerOpen(false)}
        onSelectChat={handleSelectConversation}
        onNewMessage={() => {
          setInboxDrawerOpen(false);
          setIsNewMessageOpen(true);
        }}
      />

      <ConversationPane
        contactInfo={contactInfo}
        conversationId={conversationId}
        peerUserId={peerUserId}
        isGroup={isGroup}
        headerEncrypted={headerEncrypted}
        messages={messages}
        isLoading={isLoading}
        currentUserId={user?.id}
        participants={participants}
        onOpenInboxDrawer={() => setInboxDrawerOpen(true)}
        onClose={() => router.back()}
        onSendMessage={handleSendMessage}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
      />

      <NewMessageDialog open={isNewMessageOpen} onClose={() => setIsNewMessageOpen(false)} />
    </div>
  );
}
