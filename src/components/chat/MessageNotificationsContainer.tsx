'use client';

import MessageNotification from './MessageNotification';

interface Notification {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  conversationId: string;
}

interface MessageNotificationsContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  onClickNotification?: (conversationId: string, senderId: string) => void;
}

export default function MessageNotificationsContainer({
  notifications,
  onRemove,
  onClickNotification,
}: MessageNotificationsContainerProps) {
  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-3 pointer-events-none">
      <div className="pointer-events-auto space-y-3">
        {notifications.map((notification, index) => (
          <MessageNotification
            key={notification.id}
            senderName={notification.senderName}
            senderAvatar={notification.senderAvatar}
            message={notification.message}
            onClose={() => onRemove(notification.id)}
            onClick={() => {
              onClickNotification?.(notification.conversationId, notification.senderId);
              onRemove(notification.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
