'use client';

import MessengerSidebar from '@/components/chat/MessengerSidebar';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface InboxPanelProps {
  conversationId: string | null;
  inboxDrawerOpen: boolean;
  onCloseDrawer: () => void;
  onSelectChat: (chat: { id: string }) => void;
  onNewMessage: () => void;
}

export default function InboxPanel({
  conversationId,
  inboxDrawerOpen,
  onCloseDrawer,
  onSelectChat,
  onNewMessage,
}: InboxPanelProps) {
  const t = useTranslations('chat');

  return (
    <>
      {inboxDrawerOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label={t('conversation.drawerCloseAriaLabel')}
          onClick={onCloseDrawer}
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
          onSelectChat={onSelectChat}
          onNewMessage={onNewMessage}
        />
      </div>
    </>
  );
}
