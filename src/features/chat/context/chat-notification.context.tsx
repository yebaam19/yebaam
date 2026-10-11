'use client';

import { useBrowserNotificationPermission } from '@/features/chat/hooks/useBrowserNotificationPermission';
import { playNotificationSound } from '@/features/chat/lib/notificationSound';
import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { socketManager } from '@/socket/socket-client';
import { useAuthStore } from '@/features/auth/store/auth.store';
import MessageNotificationsContainer from '@/components/chat/MessageNotificationsContainer';

type IncomingMessageEvent = {
  conversationId: string;
  senderName?: string;
  senderAvatar?: string;
  message: {
    id: string;
    senderId: string;
    content: string | { text?: string; _value?: string; value?: string };
  };
};

interface MessageNotification {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  conversationId: string;
}

interface ChatNotificationContextValue {
  notifications: MessageNotification[];
  addNotification: (notification: MessageNotification) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  // Sistema para rastrear conversaciones abiertas
  openConversations: Set<string>;
  markConversationAsOpen: (conversationId: string) => void;
  markConversationAsClosed: (conversationId: string) => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextValue | null>(null);

export function ChatNotificationProvider({ children }: { children: ReactNode }) {
  const parent = useContext(ChatNotificationContext);
  // Public layouts also render without the authenticated app shell. Create
  // state only when there is no outer owner, so both entry paths share it.
  if (parent) return children;
  return <ChatNotificationOwner>{children}</ChatNotificationOwner>;
}

function ChatNotificationOwner({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);
  const hasPermission = useBrowserNotificationPermission();
  const [openConversations, setOpenConversations] = useState<Set<string>>(new Set());
  const user = useAuthStore((state) => state.user);
  const chatSocket = socketManager.getSocket('/chat');



  const addNotification = useCallback((notification: MessageNotification) => {
    setNotifications((prev) => [...prev, notification]);

    // Notificación del navegador (si la pestaña no está activa)
    if (hasPermission && document.hidden) {
      const browserNotification = new Notification(notification.senderName, {
        body: notification.message,
        icon: notification.senderAvatar || '/default-avatar.png',
        tag: notification.conversationId,
        requireInteraction: false,
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };

      setTimeout(() => browserNotification.close(), 5000);
    }

    // Reproducir sonido
    playNotificationSound();
  }, [hasPermission]);

  // Escuchar mensajes nuevos globalmente
  useEffect(() => {
    if (!chatSocket || !user) {
      return;
    }

    const handleNewMessage = async (event: IncomingMessageEvent) => {


      // Solo notificar si NO soy el remitente
      if (event.message.senderId !== user.id) {

        const senderName = event.senderName || 'Nuevo mensaje';
        const senderAvatar = event.senderAvatar || '';

        // Verificar si la conversación está abierta
        const isConversationOpen = openConversations.has(event.conversationId);

        // Solo agregar notificación visual si la conversación NO está abierta
        if (!isConversationOpen) {


          // El backend puede enviar content como string o como objeto {type, text} o {_value}
          let messageText = '';
          if (typeof event.message.content === 'string') {
            messageText = event.message.content;
          } else if (event.message.content && typeof event.message.content === 'object') {
            // Manejar diferentes estructuras: {text}, {_value}, {value}
            messageText = event.message.content.text ||
                         event.message.content._value ||
                         event.message.content.value ||
                         '';
          }

          addNotification({
            id: event.message.id,
            senderId: event.message.senderId,
            senderName,
            senderAvatar,
            message: messageText,
            conversationId: event.conversationId,
          });
        } else {

        }
      } else {

      }
    };

    chatSocket.on('message_received', handleNewMessage);

    return () => {
      chatSocket.off('message_received', handleNewMessage);
    };
  }, [chatSocket, user, openConversations, addNotification]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markConversationAsOpen = useCallback((conversationId: string) => {

    setOpenConversations((prev) => new Set(prev).add(conversationId));
  }, []);

  const markConversationAsClosed = useCallback((conversationId: string) => {

    setOpenConversations((prev) => {
      const newSet = new Set(prev);
      newSet.delete(conversationId);
      return newSet;
    });
  }, []);



  const handleClickNotification = useCallback(() => {

  }, []);

  const value: ChatNotificationContextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    openConversations,
    markConversationAsOpen,
    markConversationAsClosed,
  };

  return (
    <ChatNotificationContext.Provider value={value}>
      {children}
      <MessageNotificationsContainer
        notifications={notifications}
        onRemove={removeNotification}
        onClickNotification={handleClickNotification}
      />
    </ChatNotificationContext.Provider>
  );
}

export function useChatNotifications() {
  const context = useContext(ChatNotificationContext);
  if (!context) {
    throw new Error('useChatNotifications must be used within ChatNotificationProvider');
  }
  return context;
}

/** Optional consumer for shells that do not mount the notification provider. */
export function useOptionalChatNotifications() {
  return useContext(ChatNotificationContext);
}
