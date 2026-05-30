'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import MessengerSidebar from '@/components/chat/MessengerSidebar';
import NewMessageDialog from '@/components/chat/NewMessageDialog';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { type Conversation, type MessageMedia } from '@/features/chat/types';
import ChatHeader from '@/components/chat/ChatHeader';
import MessagesList from '@/components/chat/MessagesList';
import ChatInput from '@/components/chat/ChatInput';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';
import { loadConversationDisplay, type ParticipantDisplay } from './conversationDisplay';
import { cn } from '@/lib/utils';

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

const noop = () => {};

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
          events: ['INSERT'],
          onChange: (payload) => {
            if (!isMounted) return;
            const row = payload.new as DbMessageRow;
            if (!row?.id) return;
            const incoming = rowToMessage(row);
            setMessages((prev) =>
              prev.some((m) => m.id === incoming.id) ? prev : mergeMessages(prev, [incoming]),
            );
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

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] min-h-0 w-full bg-neutral-50 dark:bg-neutral-950">
      {inboxDrawerOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label={t('conversation.drawerCloseAriaLabel')}
          onClick={() => setInboxDrawerOpen(false)}
        />
      )}

      <div
        className={cn(
          'relative z-40 flex h-full min-h-0 shrink-0 shadow-xl md:static md:z-auto md:shadow-none',
          inboxDrawerOpen ? 'fixed bottom-0 left-0 md:static' : 'hidden md:flex',
        )}
      >
        <MessengerSidebar
          activeChat={null}
          highlightConversationId={conversationId}
          onSelectChat={handleSelectConversation}
          onNewMessage={() => {
            setInboxDrawerOpen(false);
            setIsNewMessageOpen(true);
          }}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-neutral-200 bg-white md:border-l dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-neutral-200 px-2 dark:border-neutral-800 md:hidden">
          <button
            type="button"
            onClick={() => setInboxDrawerOpen(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-primary-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {t('conversation.conversationsButton')}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ChatHeader
            contactName={contactInfo.name}
            contactAvatar={contactInfo.avatar}
            isOnline={contactInfo.isOnline}
            conversationId={conversationId ?? undefined}
            peerUserId={peerUserId ?? undefined}
            isEncrypted={headerEncrypted}
            onClose={() => router.back()}
          />

          <MessagesList
            messages={messages}
            isLoading={isLoading}
            isTyping={false}
            currentUserId={user?.id}
            contactAvatar={contactInfo.avatar}
            contactName={contactInfo.name}
            isGroup={isGroup}
            participants={participants}
          />

          <ChatInput
            onSendMessage={handleSendMessage}
            onTypingStart={noop}
            onTypingStop={noop}
            typingTimeoutRef={{ current: null }}
          />
        </div>
      </div>

      <NewMessageDialog open={isNewMessageOpen} onClose={() => setIsNewMessageOpen(false)} />
    </div>
  );
}
