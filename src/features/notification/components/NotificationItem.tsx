'use client';

import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { NotificationType, type Notification } from '../interfaces/notification.interfaces';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { useNotificationNavigation } from '../hooks/useNotificationNavigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import NotificationIcon from './NotificationIcon';
import NotificationContent from './NotificationContent';
import FriendRequestActions from './FriendRequestActions';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

export default function NotificationItem({
  notification,
  onRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const t = useTranslations('notification.item');

  // `String(... ?? '')` — a malformed row can arrive with `type` undefined;
  // calling .toUpperCase() on it would crash the whole notification list.
  const isFriendRequest = notification.type === NotificationType.FRIEND_REQUEST ||
                          String(notification.type ?? '').toUpperCase() === 'FRIEND_REQUEST';
  
  // Intentar obtener el friendshipId de múltiples fuentes (priorizar friendshipId)
  const meta = notification.metadata as
    | (typeof notification.metadata & { requestId?: string; friendRequestId?: string })
    | undefined;
  const requestId: string | undefined =
    meta?.friendshipId || meta?.requestId || meta?.friendRequestId;

  // Para solicitudes de amistad: el actor es quien ENVIÓ la solicitud (requester)
  // El usuario actual (userId) debería ser el destinatario (addressee) para poder aceptar
  const isRecipient = isFriendRequest && notification.actor?.id !== user?.id;

  // Hook para acciones (aceptar/rechazar)
  const {
    isProcessing,
    isAccepted,
    isRejected,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
  } = useNotificationActions({
    notificationId: notification.id,
    requestId,
    onRead,
    onDelete,
  });

  // Mark-as-read BEFORE navigating, otherwise the await races with unmount
  // and the bell popover's next fetchNotifications resurrects the unread
  // state from the DB. Run unconditionally — legacy friend_request rows can
  // have a NULL related_id, so requestId may be missing even though the row
  // is still a valid unread notification.
  const handleNotificationClick = async () => {
    if (!notification.isRead) {
      try {
        await onRead(notification.id)
      } catch {
        // swallow — navigation proceeds either way
      }
    }
    if (isFriendRequest && requestId) {
      router.push(`/feed/friendships/requests/${requestId}`)
    } else {
      handleNavigationClick()
    }
  };

  // Hook para navegación normal (no friend requests)
  const { handleClick: handleNavigationClick } = useNotificationNavigation({
    notification,
    isFriendRequest,
    onClick,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <>
      <div
        onClick={handleNotificationClick}
        className={cn(
          'group relative flex gap-3 p-4 cursor-pointer transition-colors',
          'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
          !notification.isRead && 'bg-primary-50/30 dark:bg-primary-900/10'
        )}
      >
      {/* Indicador circular verde para notificaciones no leídas */}
      {!notification.isRead && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
          </div>
        </div>
      )}

      {/* Avatar con badge de tipo */}
      <NotificationIcon 
        avatarSrc={notification.actor.avatar} 
        type={notification.type} 
      />

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <NotificationContent notification={notification} />

        {/* Botones de aceptar/rechazar para solicitudes de amistad */}
        {/* SOLO mostrar si el usuario es el DESTINATARIO (no el remitente) */}
        {isFriendRequest && isRecipient && requestId && (
          <FriendRequestActions
            isProcessing={isProcessing}
            isAccepted={isAccepted}
            isRejected={isRejected}
            onAccept={handleAcceptFriendRequest}
            onReject={handleRejectFriendRequest}
          />
        )}

        {/* Si es una solicitud que YO ENVIÉ, mostrar estado */}
        {isFriendRequest && !isRecipient && (
          <div className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            {t('requestSentWaiting')}
          </div>
        )}
      </div>

      {/* Botón de eliminar - solo si NO es solicitud de amistad */}
      {!isFriendRequest && (
        <button
          onClick={handleDelete}
          className={cn(
            'shrink-0 h-8 w-8 rounded-full flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-neutral-200 dark:hover:bg-neutral-700'
          )}
          aria-label={t('deleteLabel')}
        >
          <XMarkIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
        </button>
      )}
      </div>
    </>
  );
}
