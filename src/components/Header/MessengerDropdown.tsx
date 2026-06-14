'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Popover } from '@headlessui/react';
import { ChatBubbleLeftRightIcon, PencilSquareIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import NewMessageDialog from '@/components/chat/NewMessageDialog';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChat } from '@/features/chat/hooks/useChat';
import { useChatStore } from '@/features/chat/store/chat.store';
import { ConversationType, type Conversation } from '@/features/chat/types';
import { chatHrefForConversation } from '@/features/chat/lib/chatHrefForConversation';
import { usePresenceStore } from '@/features/presence/store/presence.store';
import { useIsXl } from '@/lib/hooks/useIsXl';
import { useTranslations } from 'next-intl';
import type { Route } from 'next';
import { MessengerConversationRow } from './MessengerConversationRow';

export default function MessengerDropdown() {
  const router = useRouter();
  const t = useTranslations('header');
  const user = useAuthStore((s) => s.user);
  const { conversations, totalUnreadCount } = useChat();
  const openBubble = useChatStore((s) => s.openBubble);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const isXl = useIsXl();
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  const sorted = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const ur = (b.unreadCount ?? 0) - (a.unreadCount ?? 0);
      if (ur !== 0) return ur;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [conversations]);

  const handleRowClick = (conv: Conversation, close: () => void) => {
    if (!user) return;

    // Group conversations open as a floating bubble on desktop (keyed by the
    // conversation id); mobile (< xl, no tray) falls back to the full page.
    if (conv.type === ConversationType.GROUP) {
      if (!isXl) {
        router.push(chatHrefForConversation(conv, user.id) as Route);
        close();
        return;
      }
      openBubble({
        contactId: conv.id,
        conversationId: conv.id,
        type: ConversationType.GROUP,
        contactName: conv.name ?? t('conversation'),
        contactAvatar: conv.avatar ?? '',
        isOnline: false,
      });
      close();
      return;
    }

    // Mobile (< xl) has no bubble tray — fall back to navigation.
    if (!isXl) {
      router.push(chatHrefForConversation(conv, user.id) as Route);
      close();
      return;
    }

    const otherId = conv.participantIds.find((id) => id !== user.id);
    if (!otherId) {
      router.push(chatHrefForConversation(conv, user.id) as Route);
      close();
      return;
    }

    openBubble({
      contactId: otherId,
      contactName: conv.name ?? t('user'),
      contactAvatar: conv.avatar ?? '',
      isOnline: onlineUserIds.has(otherId),
    });
    close();
  };

  return (
    <>
    <Popover className="relative">
      {() => (
        <>
          <Popover.Button
            className={cn(
              'relative rounded-full p-2 transition-colors',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            )}
            title={t('messages')}
            aria-label={t('messages')}
          >
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
            {totalUnreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </Popover.Button>

          <Popover.Panel
            transition
            className="absolute right-0 z-50 mt-2 w-[360px] max-w-[95vw] transition duration-200 ease-out data-closed:translate-y-1 data-closed:opacity-0"
          >
            {({ close }) => (
                <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-neutral-900 dark:ring-neutral-700">
                  <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {t('messages')}
                    </h2>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewMessageOpen(true);
                          close();
                        }}
                        title={t('newMessage')}
                        aria-label={t('newMessage')}
                        className="rounded-full p-1.5 text-primary-600 transition-colors hover:bg-neutral-100 dark:text-primary-400 dark:hover:bg-neutral-800"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <Link
                        href={'/chat' as Route}
                        onClick={() => close()}
                        className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                      >
                        {t('viewAll')}
                      </Link>
                    </div>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto">
                    {sorted.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {t('noConversations')}
                        </p>
                        <Link
                          href={'/feed/friends' as Route}
                          onClick={() => close()}
                          className="mt-2 inline-block text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                        >
                          {t('startChattingWithFriends')}
                        </Link>
                      </div>
                    ) : (
                      <ul className="py-1">
                        {sorted.map((conv) => {
                          const otherId =
                            conv.type === ConversationType.DIRECT && user
                              ? conv.participantIds.find((id) => id !== user.id)
                              : null;
                          const isOnline = otherId ? onlineUserIds.has(otherId) : false;
                          return (
                            <MessengerConversationRow
                              key={conv.id}
                              conv={conv}
                              isOnline={isOnline}
                              currentUserId={user?.id}
                              onClick={() => handleRowClick(conv, close)}
                            />
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {sorted.length > 0 && (
                    <div className="border-t border-neutral-200 dark:border-neutral-800">
                      <Link
                        href={'/chat' as Route}
                        onClick={() => close()}
                        className="block py-3 text-center text-sm font-semibold text-primary-600 transition-colors hover:bg-neutral-50 dark:text-primary-400 dark:hover:bg-neutral-800"
                      >
                        {t('viewAllInMessenger')}
                      </Link>
                    </div>
                  )}
                </div>
              )}
          </Popover.Panel>
        </>
      )}
    </Popover>

    <NewMessageDialog open={isNewMessageOpen} onClose={() => setIsNewMessageOpen(false)} openInBubble />
    </>
  );
}
