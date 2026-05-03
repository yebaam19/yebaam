'use client';

import { useState } from 'react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import MessengerChatView from './MessengerChatView';
import MessengerSidebar from './MessengerSidebar';
import NewMessageDialog from './NewMessageDialog';


interface MessengerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ActiveChat {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

export default function MessengerPanel({ isOpen, onClose }: MessengerPanelProps) {
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-6xl h-[calc(100vh-120px)] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl overflow-hidden flex pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 bg-white dark:bg-neutral-900 z-10 rounded-t-xl">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Chats
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex w-full pt-14">
            {/* Sidebar - Conversaciones */}
            <MessengerSidebar
              activeChat={activeChat}
              onSelectChat={setActiveChat}
              onNewMessage={() => setIsNewMessageOpen(true)}
            />

            {/* Chat View */}
            <MessengerChatView
              activeChat={activeChat}
              onClose={() => setActiveChat(null)}
              contactId={activeChat?.id || ''}
              contactName={activeChat?.name || ''}
              contactAvatar={activeChat?.avatar || ''}
              isOnline={activeChat?.isOnline || false}
            />
          </div>
        </div>
      </div>

      <NewMessageDialog
        open={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
        onConversationOpened={(chat) => setActiveChat(chat)}
      />
    </>
  );
}
