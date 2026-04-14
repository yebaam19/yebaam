'use client';

import { useChatNotifications } from '@/features/chat/context/chat-notification.context';

export default function UnreadMessagesBadge() {
  let unreadCount = 0;

  try {
    const { notifications } = useChatNotifications();
    unreadCount = notifications.length;
  } catch {
    // Si no hay provider, no mostrar nada
    return null;
  }

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-neutral-900">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
