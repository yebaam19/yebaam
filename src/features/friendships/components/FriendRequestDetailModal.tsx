/**
 * FriendRequestDetailModal
 * 
 * Modal para mostrar el detalle completo de una solicitud de amistad:
 * - Perfil del solicitante/destinatario (según el contexto)
 * - Mensaje personalizado (si existe)
 * - Botones de acción: Aceptar, Rechazar, Cancelar
 * - Tiempo de envío
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  XMarkIcon, 
  CheckIcon, 
  XCircleIcon, 
  ClockIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon 
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { friendshipsService } from '../services/friendships.service';
import { toast } from 'sonner';

interface FriendRequestDetailModalProps {
  friendshipId: string;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

interface RequesterProfileData {
  friendshipId: string;
  requesterId: string;
  addresseeId: string;
  message?: string;
  sentAt: string;
  status: string;
  profile: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  profileType: 'requester' | 'addressee';
}

export default function FriendRequestDetailModal({
  friendshipId,
  isOpen,
  onClose,
  onActionComplete,
}: FriendRequestDetailModalProps) {
  const [data, setData] = useState<RequesterProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | 'cancel' | null>(null);

  // Cargar datos del perfil
  useEffect(() => {
    if (isOpen && friendshipId) {
      loadProfileData();
    }
  }, [isOpen, friendshipId]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const response = await friendshipsService.getRequesterProfile(friendshipId);
      setData(response);
    } catch (error: any) {
      console.error('Error loading friend request profile:', error);
      toast.error(error.message || 'Error al cargar el perfil');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!data) return;
    
    setActionLoading('accept');
    try {
      await friendshipsService.acceptFriendRequest(friendshipId);
      toast.success('¡Solicitud aceptada! Ahora son amigos 🎉');
      onActionComplete?.();
      onClose();
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      toast.error(error.message || 'Error al aceptar la solicitud');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!data) return;
    
    setActionLoading('reject');
    try {
      await friendshipsService.rejectFriendRequest(friendshipId);
      toast.success('Solicitud rechazada');
      onActionComplete?.();
      onClose();
    } catch (error: any) {
      console.error('Error rejecting friend request:', error);
      toast.error(error.message || 'Error al rechazar la solicitud');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!data) return;
    
    setActionLoading('cancel');
    try {
      await friendshipsService.cancelFriendRequest(friendshipId);
      toast.success('Solicitud cancelada');
      onActionComplete?.();
      onClose();
    } catch (error: any) {
      console.error('Error canceling friend request:', error);
      toast.error(error.message || 'Error al cancelar la solicitud');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  const timeAgo = data?.sentAt
    ? formatDistanceToNow(new Date(data.sentAt), {
        addSuffix: true,
        locale: es,
      })
    : '';

  // Determinar si el usuario actual es el destinatario (puede aceptar/rechazar)
  // o el remitente (puede cancelar)
  const isAddressee = data?.profileType === 'requester';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl">
        {/* Header con botón cerrar */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Solicitud de amistad
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-sm text-neutral-500">Cargando...</p>
            </div>
          ) : data ? (
            <>
              {/* Avatar y nombre */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  {data.profile.avatar ? (
                    <img
                      src={data.profile.avatar}
                      alt={data.profile.username}
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary-100 dark:border-primary-900"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center border-4 border-primary-100 dark:border-primary-900">
                      <UserIcon className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  {data.profile.firstName} {data.profile.lastName}
                </h3>
                
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                  @{data.profile.username}
                </p>

                {/* Badge de tipo de solicitud */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium">
                  <ClockIcon className="w-3 h-3" />
                  {timeAgo}
                </div>
              </div>

              {/* Mensaje personalizado (si existe) */}
              {data.message && (
                <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                      Mensaje
                    </p>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    &quot;{data.message}&quot;
                  </p>
                </div>
              )}

              {/* Información adicional */}
              <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Estado:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                    {data.status === 'pending' ? 'Pendiente' : data.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Tipo:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {isAddressee ? 'Solicitud recibida' : 'Solicitud enviada'}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="space-y-3">
                {isAddressee ? (
                  // Si eres el destinatario: mostrar Aceptar y Rechazar
                  <>
                    <button
                      onClick={handleAccept}
                      disabled={actionLoading !== null}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'accept' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Aceptando...</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-5 h-5" />
                          <span>Aceptar solicitud</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleReject}
                      disabled={actionLoading !== null}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'reject' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                          <span>Rechazando...</span>
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="w-5 h-5" />
                          <span>Rechazar</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  // Si eres el remitente: mostrar solo Cancelar
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading !== null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 'cancel' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Cancelando...</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="w-5 h-5" />
                        <span>Cancelar solicitud</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500">No se pudo cargar la información</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
