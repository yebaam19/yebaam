'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim';
import MessengerSidebar from '@/components/chat/MessengerSidebar';

export default function MessengerLandingClient() {
  const router = useRouter();

  const handleSelectConversation = (chat: { id: string }) => {
    router.push(`/chat/${chat.id}` as Route);
  };

  const handleNewMessage = () => {
    router.push('/feed/friends' as Route);
  };

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] min-h-0 w-full bg-neutral-50 dark:bg-neutral-950">
      <div className="flex h-full min-h-0 w-full md:w-auto md:shrink-0">
        <MessengerSidebar
          activeChat={null}
          highlightConversationId={null}
          onSelectChat={handleSelectConversation}
          onNewMessage={handleNewMessage}
        />
      </div>

      <div className="hidden min-h-0 min-w-0 flex-1 items-center justify-center border-l border-neutral-200 bg-white md:flex dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col items-center px-6 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
            <ChatBubbleLeftRightIcon className="h-10 w-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Selecciona un chat
          </h2>
          <p className="mt-2 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
            Elige una conversación de la lista para empezar a chatear.
          </p>
        </div>
      </div>
    </div>
  );
}
