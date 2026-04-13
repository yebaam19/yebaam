'use client';

import { useState, useRef, useEffect } from 'react';
import {
  useConversationMessages,
  useSendMessageAsPage,
  useMarkMessagesAsRead,
} from '../../hooks/usePageMessages';
import { usePageMessagesWebSocket } from '../../hooks/usePageMessagesWebSocket';
import { MessageType } from '../../interfaces/page-message.interface';
import { PaperAirplaneIcon } from '@/components/icons/heroicons-shim';
import { CheckIcon } from '@/components/icons/heroicons-shim';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActiveConversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  unreadCount: number;
}

interface PageMessengerChatViewProps {
  pageId: string;
  activeConversation: ActiveConversation | null;
  onClose: () => void;
}

export function PageMessengerChatView({
  pageId,
  activeConversation,
  onClose,
}: PageMessengerChatViewProps) {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Queries
  const { data: messagesData, isLoading } = useConversationMessages(
    pageId,
    activeConversation?.id
  );

  // Mutations
  const sendMessage = useSendMessageAsPage(pageId);
  const markAsRead = useMarkMessagesAsRead(pageId, activeConversation?.id || '');

  // WebSocket
  const { isConnected, emitTyping } = usePageMessagesWebSocket({
    pageId,
    conversationId: activeConversation?.id,
    onNewMessage: (message) => {
      console.log('New message received:', message);
      // Auto-scroll al final
      setTimeout(() => scrollToBottom(), 100);
    },
    onTyping: (data) => {
      if (data.isTyping) {
        setIsTyping(true);
      } else {
        setIsTyping(false);
      }
    },
  });

  const messages = messagesData?.messages || [];

  // Auto-scroll al final cuando cambian los mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Marcar como leído cuando se abre la conversación
  useEffect(() => {
    if (activeConversation && activeConversation.unreadCount > 0) {
      markAsRead.mutate();
    }
  }, [activeConversation?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeConversation) return;

    try {
      await sendMessage.mutateAsync({
        message: messageText,
        messageType: MessageType.TEXT,
      });
      setMessageText('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (!activeConversation) return;

    // Emitir evento de typing
    emitTyping(activeConversation.id, 'Página', true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(activeConversation.id, 'Página', false);
    }, 3000);
  };

  // Empty state
  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 text-neutral-500">
        <svg
          className="w-24 h-24 mb-4 text-neutral-300 dark:text-neutral-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-lg font-medium">Selecciona una conversación</p>
        <p className="text-sm">Elige un cliente para ver los mensajes</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {activeConversation.userAvatar ? (
            <img
              src={activeConversation.userAvatar}
              alt={activeConversation.userName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
              {activeConversation.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              {activeConversation.userName}
            </h3>
            <p className="text-xs text-neutral-500">
              {isConnected ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Conectado
                </span>
              ) : (
                'Desconectado'
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => markAsRead.mutate()}
          className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
        >
          <CheckIcon className="h-4 w-4" />
          Marcar leído
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-neutral-500">Cargando mensajes...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-500">
            <p>No hay mensajes aún</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isFromPage = msg.senderType === 'page';
              const timeAgo = formatDistanceToNow(new Date(msg.createdAt), {
                addSuffix: true,
                locale: es,
              });

              return (
                <div
                  key={msg.id}
                  className={`flex ${isFromPage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isFromPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span
                        className={`text-xs ${
                          isFromPage ? 'text-blue-100' : 'text-neutral-500'
                        }`}
                      >
                        {timeAgo}
                      </span>
                      {isFromPage && (
                        <span className="text-xs">
                          {msg.isRead ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Escribe una respuesta..."
            rows={1}
            className="flex-1 resize-none px-4 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
            style={{
              minHeight: '48px',
              maxHeight: '128px',
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessage.isPending}
            className="shrink-0 w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg flex items-center justify-center text-white transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          Presiona Enter para enviar, Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}
