/**
 * useNotificationNavigation
 * 
 * Hook para manejar la navegación al hacer clic en notificaciones:
 * - Construcción de targetUrl con fallback
 * - Marcado como leída
 * - Navegación
 */

import type { Notification } from '../interfaces/notification.interfaces';

interface UseNotificationNavigationProps {
  notification: Notification;
  isFriendRequest: boolean;
  onRead: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

export const useNotificationNavigation = ({
  notification,
  isFriendRequest,
  onRead,
  onClick,
}: UseNotificationNavigationProps) => {
  const handleClick = () => {
    let finalTargetUrl = notification.targetUrl;
    
    //  CORRECCIÓN DE URLs LEGACY: Detectar y corregir URLs viejas incorrectas
    // URLs incorrectas: /profile/{username} o /feed/profile/{username} → debe ser /{username}
    if (finalTargetUrl && (finalTargetUrl.startsWith('/profile/') || finalTargetUrl.startsWith('/feed/profile/'))) {
      const oldUrl = finalTargetUrl;
      // Si tenemos el username del actor, usarlo (más confiable)
      if (notification.actor?.username) {
        finalTargetUrl = `/${notification.actor.username}`;
        console.warn('[useNotificationNavigation] 🔧 URL LEGACY corregida:', {
          old: oldUrl,
          new: finalTargetUrl,
          reason: 'Usando ruta correcta /{username}'
        });
      } else {
        // Extraer username de la URL vieja
        const usernameMatch = oldUrl.match(/\/(?:feed\/)?profile\/(.+)$/);
        if (usernameMatch) {
          finalTargetUrl = `/${usernameMatch[1]}`;
          console.warn('[useNotificationNavigation] 🔧 URL LEGACY corregida:', {
            old: oldUrl,
            new: finalTargetUrl,
            reason: 'Extraído username de URL legacy'
          });
        }
      }
    }
    
    // Construir targetUrl si no existe (para notificaciones muy viejas sin targetUrl)
    if (!finalTargetUrl && notification.actor) {
      if (notification.actor.username) {
        // Usar la ruta correcta /{username} en lugar de /feed/profile/{username}
        finalTargetUrl = `/${notification.actor.username}`;
        console.log('[useNotificationNavigation] Construyendo targetUrl desde actor.username:', finalTargetUrl);
      } else {
        // Si no hay username, no podemos construir la URL
        console.error('[useNotificationNavigation] ❌ No se puede construir targetUrl: falta username en actor');
        return; // No navegar si no hay username
      }
    }

    console.log('[useNotificationNavigation] Click:', {
      type: notification.type,
      isFriendRequest,
      originalTargetUrl: notification.targetUrl,
      finalTargetUrl,
      actorId: notification.actor?.id,
      actorUsername: notification.actor?.username,
    });

    // Marcar como leída si no lo está (pero no para friend requests)
    if (!notification.isRead && !isFriendRequest) {
      onRead(notification.id);
    }
    
    // Ejecutar callback de click si existe
    if (onClick) {
      onClick(notification);
    } else if (finalTargetUrl) {
      // Navegar a la URL de destino
      console.log('[useNotificationNavigation] Navegando a:', finalTargetUrl);
      window.location.href = finalTargetUrl;
    } else {
      console.warn('[useNotificationNavigation] No hay targetUrl ni actor.id para navegar', notification);
    }
  };

  return { handleClick };
};
