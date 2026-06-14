/**
 * FriendRequestDetailModal
 *
 * Modal para mostrar el detalle completo de una solicitud de amistad:
 * - Perfil del solicitante/destinatario (según el contexto)
 * - Mensaje personalizado (si existe)
 * - Botones de acción: Aceptar, Rechazar, Cancelar
 * - Tiempo de envío
 *
 * Orchestration shell only: data loading, action handlers, and modal chrome.
 * The visual sections live in ./detailModal/{ProfileHeader,MessageSection,
 * InfoSection,ActionButtons}.
 */

'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/lib/utils/date-fns-locale';
import { friendshipsService } from '../services/friendships.service';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { ProfileHeader } from './detailModal/ProfileHeader';
import { MessageSection } from './detailModal/MessageSection';
import { InfoSection } from './detailModal/InfoSection';
import { ActionButtons } from './detailModal/ActionButtons';
import type { FriendRequestAction, RequesterProfileData } from './detailModal/types';

interface FriendRequestDetailModalProps {
  friendshipId: string;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

export default function FriendRequestDetailModal({
  friendshipId,
  isOpen,
  onClose,
  onActionComplete,
}: FriendRequestDetailModalProps) {
  const [data, setData] = useState<RequesterProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<FriendRequestAction | null>(null);
  const t = useTranslations('friendships.detailModal');
  const dateLocale = useDateFnsLocale();

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
      toast.error(error.message || t('errorLoad'));
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
      toast.success(t('successAccepted'));
      onActionComplete?.();
      onClose();
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      toast.error(error.message || t('errorAccept'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!data) return;

    setActionLoading('reject');
    try {
      await friendshipsService.rejectFriendRequest(friendshipId);
      toast.success(t('successRejected'));
      onActionComplete?.();
      onClose();
    } catch (error: any) {
      console.error('Error rejecting friend request:', error);
      toast.error(error.message || t('errorReject'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!data) return;

    setActionLoading('cancel');
    try {
      await friendshipsService.cancelFriendRequest(friendshipId);
      toast.success(t('successCancelled'));
      onActionComplete?.();
      onClose();
    } catch (error: any) {
      console.error('Error canceling friend request:', error);
      toast.error(error.message || t('errorCancel'));
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  const timeAgo = data?.sentAt
    ? formatDistanceToNow(new Date(data.sentAt), {
        addSuffix: true,
        locale: dateLocale,
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
            {t('title')}
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
              <p className="mt-4 text-sm text-neutral-500">{t('loading')}</p>
            </div>
          ) : data ? (
            <>
              <ProfileHeader profile={data.profile} timeAgo={timeAgo} />
              <MessageSection message={data.message} />
              <InfoSection status={data.status} isAddressee={isAddressee} />
              <ActionButtons
                isAddressee={isAddressee}
                actionLoading={actionLoading}
                onAccept={handleAccept}
                onReject={handleReject}
                onCancel={handleCancel}
              />
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500">{t('unavailable')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
