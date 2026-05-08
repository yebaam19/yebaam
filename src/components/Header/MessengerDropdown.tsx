'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Popover } from '@headlessui/react';
import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import Avatar from '@/ui/Avatar';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChat } from '@/features/chat/hooks/useChat';
import { useChatStore } from '@/features/chat/store/chat.store';
import { ConversationType, type Conversation } from '@/features/chat/types';
import { chatHrefForConversation } from '@/features/chat/lib/chatHrefForConversation';
import { usePresenceStore } from '@/features/presence/store/presence.store';
import { useIsXl } from '@/lib/hooks/useIsXl';
import type { Route } from 'next';

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `${diffMin} m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} d`;
  return d.toLocaleDateString();
}

function previewFor(conv: Conversation, currentUserId: string): string {
  const last = conv.lastMessage;
  if (!last) return 'Sin mensajes aún';
  const prefix = last.senderId === currentUserId ? 'Tú: ' : '';
  if (last.content && last.content.trim()) return prefix + last.content;
  if (last.media) return `${prefix}📎 Adjunto`;
  return prefix;
}

function initialsFor(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function MessengerDropdown() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { conversations, totalUnreadCount } = useChat();
  const openBubble = useChatStore((s) => s.openBubble);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const isXl = useIsXl();

  const sorted = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const ur = (b.unreadCount ?? 0) - (a.unreadCount ?? 0);
      if (ur !== 0) return ur;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [conversations]);

  const handleRowClick = (conv: Conversation, close: () => void) => {
    if (!user) return;

    // Group conversations always navigate to the full page (v1 limitation —
    // group bubbles need a different ChatBubble variant keyed by conversationId).
    if (conv.type === ConversationType.GROUP) {
      router.push(chatHrefForConversation(conv, user.id) as Route);
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
      contactName: conv.name ?? 'Usuario',
      contactAvatar: conv.avatar ?? '',
      isOnline: onlineUserIds.has(otherId),
    });
    close();
  };

  return (
    <Popover className="relative">
      {() => (
        <>
          <Popover.Button
            className={cn(
              'relative rounded-full p-2 transition-colors',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            )}
            title="Mensajes"
            aria-label="Mensajes"
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
                      Mensajes
                    </h2>
                    <Link
                      href={'/chat' as Route}
                      onClick={() => close()}
                      className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                    >
                      Ver todo
                    </Link>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto">
                    {sorted.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          No tienes conversaciones
                        </p>
                        <Link
                          href={'/feed/friends' as Route}
                          onClick={() => close()}
                          className="mt-2 inline-block text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                        >
                          Empieza chateando con tus amigos
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
                            <li key={conv.id}>
                              <button
                                type="button"
                                onClick={() => handleRowClick(conv, close)}
                                className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                              >
                                <div className="relative shrink-0">
                                  <Avatar
                                    className="h-12 w-12"
                                    src={conv.avatar}
                                    initials={initialsFor(conv.name)}
                                  />
                                  {isOnline && (
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-neutral-900" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p
                                      className={cn(
                                        'truncate text-sm',
                                        conv.unreadCount > 0
                                          ? 'font-semibold text-neutral-900 dark:text-white'
                                          : 'font-medium text-neutral-800 dark:text-neutral-200',
                                      )}
                                    >
                                      {conv.name ?? 'Conversación'}
                                    </p>
                                    <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                                      {formatRelativeTime(conv.updatedAt)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <p
                                      className={cn(
                                        'truncate text-xs',
                                        conv.unreadCount > 0
                                          ? 'font-medium text-neutral-900 dark:text-white'
                                          : 'text-neutral-500 dark:text-neutral-400',
                                      )}
                                    >
                                      {user ? previewFor(conv, user.id) : ''}
                                    </p>
                                    {conv.unreadCount > 0 && (
                                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-bold text-white">
                                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            </li>
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
                        Ver todo en Messenger
                      </Link>
                    </div>
                  )}
                </div>
              )}
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
}
