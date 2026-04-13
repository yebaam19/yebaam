'use client';

import { useState } from 'react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { PageMessengerSidebar } from './PageMessengerSidebar';
import { PageMessengerChatView } from './PageMessengerChatView';

interface PageMessengerPanelProps {
  pageId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ActiveConversation {
  id: string; // conversationId
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  unreadCount: number;
}

/**
 * Panel de mensajería para páginas - Reutiliza diseño de MessengerPanel
 * Muestra conversaciones de clientes y permite responder como página
 */
export default function PageMessengerPanel({ 
  pageId, 
  isOpen, 
  onClose 
}: PageMessengerPanelProps) {
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);

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
          className="w-full max-w-6xl h-[calc(100vh-120px)] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl overflow-hidden flex pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 bg-white dark:bg-neutral-900 z-10">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Mensajes de Página
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
            {/* Sidebar - Lista de Conversaciones */}
            <PageMessengerSidebar
              pageId={pageId}
              activeConversation={activeConversation}
              onSelectConversation={setActiveConversation}
            />

            {/* Chat View - Vista de Mensajes */}
            <PageMessengerChatView
              pageId={pageId}
              activeConversation={activeConversation}
              onClose={() => setActiveConversation(null)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
