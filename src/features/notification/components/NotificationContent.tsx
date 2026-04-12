/**
 * NotificationContent
 * 
 * Componente para mostrar el contenido de la notificación:
 * - Mensaje (actor + texto)
 * - Preview de post/comentario
 * - Imagen
 * - Tiempo transcurrido
 */

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Notification } from '../interfaces/notification.interfaces';

interface NotificationContentProps {
  notification: Notification;
}

export default function NotificationContent({ notification }: NotificationContentProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div className="flex-1 min-w-0">
      {/* Mensaje */}
      <p className="text-sm text-neutral-900 dark:text-neutral-100">
        <span className="font-semibold">
          {notification.actor.displayName}
        </span>{' '}
        <span className="text-neutral-700 dark:text-neutral-300">
          {notification.message}
        </span>
      </p>

      {/* Preview de post (si existe) */}
      {notification.metadata?.postPreview && (
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
          {notification.metadata.postPreview}
        </p>
      )}

      {/* Preview de comentario (si existe) */}
      {notification.metadata?.commentPreview && (
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
          &quot;{notification.metadata.commentPreview}&quot;
        </p>
      )}

      {/* Imagen preview (si existe) */}
      {notification.metadata?.postImageUrl && (
        <div className="mt-2">
          <img
            src={notification.metadata.postImageUrl}
            alt="Preview"
            className="h-16 w-16 rounded-lg object-cover"
          />
        </div>
      )}

      {/* Tiempo */}
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}
