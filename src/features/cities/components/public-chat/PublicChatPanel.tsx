'use client';

/**
 * PublicChatPanel — client shell for the City Portal public chat (one
 * permanent room per city, capacity 250). Wires together the realtime
 * subscription on `public_chat_messages`, the header, the message list,
 * and the composer. Unauthenticated visitors get a read-only view with a
 * sign-in CTA so the page never looks broken.
 *
 * Performance: this is the only client component on the page. RSC owns
 * initial messages, the topic id, and the user id — so the panel mounts
 * fast and only the realtime delta path runs in the browser.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';
import { sendCityPublicChatMessage } from '@/features/cities/actions/public-chat.actions';
import type { PublicChatMessage } from '@/features/cities/server/public-chat.server';
import { MessageList } from './MessageList';
import { Composer } from './Composer';

interface PublicChatPanelProps {
  topicId: string;
  cityName: string;
  initialMessages: PublicChatMessage[];
  currentUserId: string | null;
  maxCapacity: number;
}

type IncomingRow = {
  id: string;
  topic_id: string;
  sender_id: string | null;
  content: string | null;
  created_at: string;
  is_deleted: boolean;
  sender_nickname: string | null;
  sender_avatar_url: string | null;
};

export function PublicChatPanel({
  topicId,
  cityName,
  initialMessages,
  currentUserId,
  maxCapacity,
}: PublicChatPanelProps) {
  const t = useTranslations('cities.publicChat');
  const [messages, setMessages] = useState<PublicChatMessage[]>(initialMessages);

  useEffect(() => {
    const channel = subscribeToTable<IncomingRow>({
      channel: `city-public-chat:${topicId}`,
      table: 'public_chat_messages',
      filter: `topic_id=eq.${topicId}`,
      events: ['INSERT'],
      onChange: (payload) => {
        if (payload.eventType !== 'INSERT') return;
        const row = payload.new as IncomingRow;
        if (!row.id) return;
        setMessages((prev) => {
          // Dedupe in case the optimistic insert beat the realtime payload.
          if (prev.some((m) => m.id === row.id)) return prev;
          const dto: PublicChatMessage = {
            id: row.id,
            topic_id: row.topic_id,
            sender_id: row.sender_id,
            content: row.content,
            created_at: row.created_at,
            is_deleted: row.is_deleted,
            sender_nickname: row.sender_nickname,
            sender_avatar_url: row.sender_avatar_url,
            author: null,
          };
          // Prepend so the newest-first ordering coming from the server
          // stays stable. MessageList reverses for display.
          return [dto, ...prev];
        });
      },
    });
    return () => unsubscribe(channel);
  }, [topicId]);

  const handleSend = useCallback(
    async (body: string) => {
      if (!currentUserId) return;
      // Optimistic message so the sender sees their post immediately even
      // before the realtime echo lands. We use a temp id so the realtime
      // dedupe step can replace it when the real INSERT arrives.
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const optimistic: PublicChatMessage = {
        id: tempId,
        topic_id: topicId,
        sender_id: currentUserId,
        content: body,
        created_at: new Date().toISOString(),
        is_deleted: false,
        sender_nickname: null,
        sender_avatar_url: null,
        author: null,
      };
      setMessages((prev) => [optimistic, ...prev]);

      const result = await sendCityPublicChatMessage(topicId, body);
      if (!result.ok) {
        // Drop the optimistic row on failure so the user can retry.
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }
      // Swap the temp id for the real one so subsequent realtime payloads
      // can dedupe correctly.
      const realId = result.data.id;
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: realId } : m)),
      );
    },
    [topicId, currentUserId],
  );

  return (
    <section className="flex h-[calc(100vh-12rem)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <header className="flex items-start gap-3 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-white px-4 py-3 dark:border-neutral-700 dark:from-primary-900/30 dark:to-neutral-800">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">
            {t('header.title')}
          </h1>
          <p className="truncate text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
            {t('header.subtitle', { city: cityName })}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
          {t('header.capacity', { count: 0, max: maxCapacity })}
        </span>
      </header>

      <MessageList messages={messages} currentUserId={currentUserId} />

      {currentUserId ? (
        <Composer onSend={handleSend} />
      ) : (
        <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-3 text-center text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          <span>{t('composer.signedOut')} · </span>
          <Link
            href={'/login' as Route}
            className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
          >
            {t('composer.signInCta')}
          </Link>
        </div>
      )}
    </section>
  );
}
