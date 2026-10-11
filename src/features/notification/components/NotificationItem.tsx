'use client';

import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useId } from 'react';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { useNotificationNavigation } from '../hooks/useNotificationNavigation';
import { NotificationType, type Notification } from '../interfaces/notification.interfaces';
import FriendRequestActions from './FriendRequestActions';
import NotificationContent from './NotificationContent';
import NotificationIcon from './NotificationIcon';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => Promise<void>;
  onDelete: (id: string) => void;
  onClick?: (notification: Notification) => void;
  onNavigate?: () => void;
}

export default function NotificationItem({
  notification,
  onRead,
  onDelete,
  onClick,
  onNavigate,
}: NotificationItemProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const t = useTranslations('notification.item');
  const contentId = useId();

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

  // The store owns the write, so client navigation can proceed immediately.
  const handleNotificationClick = () => {
    if (!notification.isRead) void onRead(notification.id).catch(() => {});
    onNavigate?.();
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
    <div
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
            <div className="h-2.5 w-2.5 rounded-full bg-primary-800" />
          </div>
        </div>
      )}

      {/* Avatar con badge de tipo */}
      <NotificationIcon 
        actorName={notification.actor.displayName || notification.actor.username}
        avatarSrc={notification.actor.avatar} 
        type={notification.type} 
      />

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div id={contentId}>
          <NotificationContent notification={notification} />
          {!notification.isRead && <span className="sr-only">{t('unreadLabel')}</span>}
        </div>

        <button
          type="button"
          onClick={handleNotificationClick}
          aria-labelledby={contentId}
          className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600"
        />

        {/* Botones de aceptar/rechazar para solicitudes de amistad */}
        {/* SOLO mostrar si el usuario es el DESTINATARIO (no el remitente) */}
        {isFriendRequest && isRecipient && requestId && (
          <div className="relative">
            <FriendRequestActions
              isProcessing={isProcessing}
              isAccepted={isAccepted}
              isRejected={isRejected}
              onAccept={handleAcceptFriendRequest}
              onReject={handleRejectFriendRequest}
            />
          </div>
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
          type="button"
          onClick={handleDelete}
          className={cn(
            'relative shrink-0 h-8 w-8 rounded-full flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity',
            'hover:bg-neutral-200 dark:hover:bg-neutral-700'
          )}
          aria-label={t('deleteLabel')}
        >
          <XMarkIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
        </button>
      )}
    </div>
  );
}
