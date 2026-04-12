'use client';

import { useState } from 'react';
import {
  usePageConversations,
  useSendMessageToPage,
  useConversationMessages,
  useMarkMessagesAsRead,
} from '../../hooks/usePageMessages';
import { usePageMessagesWebSocket } from '../../hooks/usePageMessagesWebSocket';
import { MessageType } from '../../interfaces/page-message.interface';

interface PageMessagesTestProps {
  pageId: string;
  userId?: string;
}

/**
 * Componente de prueba para el sistema de mensajería de páginas
 * Muestra conversaciones, mensajes y permite enviar mensajes
 */
export function PageMessagesTest({ pageId, userId }: PageMessagesTestProps) {
  const [messageText, setMessageText] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Queries
  const { data: conversationsData, isLoading: loadingConversations } = usePageConversations(pageId);
  const { data: messagesData, isLoading: loadingMessages } = useConversationMessages(
    pageId,
    selectedConversationId || undefined
  );

  // Mutations
  const sendMessage = useSendMessageToPage(pageId);
  const markAsRead = useMarkMessagesAsRead(pageId, selectedConversationId || '');

  // WebSocket
  const { isConnected, emitTyping } = usePageMessagesWebSocket({
    pageId,
    conversationId: selectedConversationId || undefined,
    onNewMessage: (message) => {
      console.log('🎉 Nuevo mensaje recibido via WebSocket:', message);
    },
    onMessagesRead: (data) => {
      console.log(' Mensajes leídos via WebSocket:', data);
    },
    onTyping: (data) => {
      console.log('✍️ Usuario escribiendo:', data);
    },
  });

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessage.mutateAsync({
        message: messageText,
        messageType: MessageType.TEXT,
      });
      setMessageText('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const handleMarkAsRead = () => {
    if (selectedConversationId) {
      markAsRead.mutate();
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h1 className="text-2xl font-bold mb-2">Sistema de Mensajería - Prueba</h1>
        <p className="text-gray-600">
          PageId: {pageId} | WebSocket:{' '}
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Conversaciones */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Conversaciones</h2>
            <p className="text-sm text-gray-500">
              {conversationsData?.total || 0} conversaciones
            </p>
          </div>
          <div className="p-4">
            {loadingConversations ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : conversationsData?.conversations.length === 0 ? (
              <p className="text-sm text-gray-500">Sin conversaciones</p>
            ) : (
              <div className="max-h-[500px] overflow-y-auto space-y-2">
                {conversationsData?.conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedConversationId === conv.id
                        ? 'bg-blue-50 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm truncate flex-1">
                        {conv.pageMetadata.pageName || 'Página'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{conv.lastMessage}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(conv.lastMessageAt).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mensajes */}
        <div className="md:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mensajes</h2>
            {selectedConversationId && (
              <button
                onClick={handleMarkAsRead}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                ✓✓ Marcar como leído
              </button>
            )}
          </div>
          <div className="p-4">
            {!selectedConversationId ? (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                Selecciona una conversación
              </div>
            ) : loadingMessages ? (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                Cargando mensajes...
              </div>
            ) : (
              <>
                {/* Lista de mensajes */}
                <div className="h-[400px] overflow-y-auto mb-4 space-y-3">
                  {messagesData?.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderType === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.senderType === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <p
                            className={`text-xs ${
                              msg.senderType === 'user' ? 'text-blue-100' : 'text-gray-600'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                          {msg.isRead && msg.senderType === 'user' && (
                            <span className="text-xs">✓✓</span>
                          )}
                          {!msg.isRead && msg.senderType === 'user' && (
                            <span className="text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input de mensaje */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMessageText(e.target.value)
                    }
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    onFocus={() => emitTyping(selectedConversationId, 'Tú', true)}
                    onBlur={() => emitTyping(selectedConversationId, 'Tú', false)}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessage.isPending}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ➤
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}