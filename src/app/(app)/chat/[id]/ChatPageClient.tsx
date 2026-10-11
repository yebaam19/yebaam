'use client';

import type { ChatMessage } from '@/features/chat/types';
import { rowToMessage, mergeMessages, type DbMessageRow } from '@/features/chat/lib/messageRows';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { useChatStore } from '@/features/chat/store/chat.store';
import { conversationCache } from '@/features/chat/lib/conversation-cache';
import { useOutgoingMessages } from '@/features/chat/hooks/useOutgoingMessages';
import NewMessageDialog from '@/components/chat/NewMessageDialog';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { type Conversation } from '@/features/chat/types';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';
import { fetchDecryptedContent, isEncryptedContent } from '@/features/chat/lib/messageCipher';
import { loadConversationDisplay, type ParticipantDisplay } from '@/features/chat/lib/conversationDisplay';
import InboxPanel from './_components/InboxPanel';
import ConversationPane from './_components/ConversationPane';

interface ChatPageClientProps {
  contactId: string;
}

export default function ChatPageClient({ contactId }: ChatPageClientProps) {
  const router = useRouter();
  const t = useTranslations('chat');
  const user = useAuthStore((state) => state.user);

  const userId = user?.id;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
    if (!contactId || !userId) return;

    let isMounted = true;
    let channel: ReturnType<typeof subscribeToTable> | null = null;

    const loadConversation = async () => {
      try {
        setIsLoading(true);
        setConversationId(null);
        setMessages([]);
        setContactInfo({ name: t('conversation.fallbackName'), avatar: '', isOnline: false });
        setHeaderEncrypted(false);
        setPeerUserId(null);
        setIsGroup(false);
        setParticipants([]);

        let resolvedConversationId: string;
        let conversationSnapshot: Conversation | null = null;
        let historyRequest: ReturnType<typeof chatService.getConversationMessages>;

        const known = useChatStore.getState().conversations.find((item) => item.id === contactId);
        const cachedId = known?.id ?? conversationCache.getConvId(contactId);
        const direct = known ?? (cachedId ? null : await chatService.findConversationByParticipant(contactId));
        if (cachedId) {
          conversationSnapshot = known ?? null;
          resolvedConversationId = cachedId;
          setConversationId(cachedId);
          const cached = conversationCache.getMessages(cachedId);
          if (cached) { setMessages(cached); setIsLoading(false); }
          historyRequest = chatService.getConversationMessages(cachedId, 50, 0);
        } else if (direct) {
          conversationSnapshot = direct;
          resolvedConversationId = direct.id;
          historyRequest = chatService.getConversationMessages(resolvedConversationId, 50, 0);
        } else {
          try {
            const probed = await chatService.getConversationMessages(contactId, 50, 0);
            historyRequest = Promise.resolve(probed);
            resolvedConversationId = contactId;
          } catch {
            const conversation = await chatService.createOrGetConversation(contactId);
            conversationSnapshot = conversation;
            resolvedConversationId = conversation.id;
            historyRequest = chatService.getConversationMessages(resolvedConversationId, 50, 0);
          }
        }

        if (!isMounted) { await historyRequest; return; }
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

        const result = await historyRequest;
        if (!isMounted) return;
        setMessages((prev) => mergeMessages(prev, result.messages));
        setIsLoading(false);

        const display = await loadConversationDisplay(resolvedConversationId, userId, conversationSnapshot);
        if (!isMounted) return;
        setContactInfo({ name: display.name, avatar: display.avatar, isOnline: display.isOnline });
        setHeaderEncrypted(display.isEncrypted);
        setPeerUserId(display.peerUserId);
        setIsGroup(display.isGroup);
        setParticipants(display.participants);

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
  }, [contactId, userId, t]);

  const { messages: visibleMessages, sendMessage: handleSendMessage } = useOutgoingMessages(conversationId, messages, setMessages);

  useEffect(() => {
    if (conversationId && !isLoading) conversationCache.setMessages(conversationId, messages);
  }, [conversationId, isLoading, messages]);
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
        messages={visibleMessages}
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
