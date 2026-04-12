/**
 * useNotificationActions
 * 
 * Hook para manejar acciones sobre notificaciones:
 * - Aceptar/rechazar solicitudes de amistad
 * - Estado de procesamiento
 * - Actualización de notificaciones
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { friendRequestService } from '@/features/user/services/friend-request.service';
import { useNotificationStore } from '../store/notification.store';

interface UseNotificationActionsProps {
  notificationId: string;
  requestId?: string;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const useNotificationActions = ({
  notificationId,
  requestId,
  onRead,
  onDelete,
}: UseNotificationActionsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const { fetchNotifications } = useNotificationStore();

  const handleAcceptFriendRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requestId || isProcessing) return;

    setIsProcessing(true);
    try {
      console.log('[useNotificationActions] Aceptando solicitud:', requestId);
      await friendRequestService.acceptFriendRequest(requestId);
      
      setIsAccepted(true);
      toast.success('Solicitud de amistad aceptada');
      
      // Refrescar notificaciones
      await fetchNotifications({ page: 1, limit: 10 });
      
      // Marcar como leída y eliminar
      onRead(notificationId);
      setTimeout(() => {
        onDelete(notificationId);
      }, 1000);
      
      console.log('[useNotificationActions]  Solicitud aceptada exitosamente');
    } catch (error: any) {
      console.error('[useNotificationActions]  Error al aceptar:', error);
      toast.error(error.response?.data?.message || error.message || 'Error al aceptar solicitud');
      setIsProcessing(false);
    }
  };

  const handleRejectFriendRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requestId || isProcessing) return;

    setIsProcessing(true);
    try {
      console.log('[useNotificationActions] Rechazando solicitud:', requestId);
      await friendRequestService.rejectFriendRequest(requestId);
      
      setIsRejected(true);
      toast.success('Solicitud rechazada');
      
      // Refrescar notificaciones
      await fetchNotifications({ page: 1, limit: 10 });
      
      // Eliminar después de 1 segundo
      setTimeout(() => {
        onDelete(notificationId);
      }, 1000);
      
      console.log('[useNotificationActions]  Solicitud rechazada exitosamente');
    } catch (error: any) {
      console.error('[useNotificationActions]  Error al rechazar:', error);
      toast.error(error.response?.data?.message || error.message || 'Error al rechazar solicitud');
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    isAccepted,
    isRejected,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
  };
};
