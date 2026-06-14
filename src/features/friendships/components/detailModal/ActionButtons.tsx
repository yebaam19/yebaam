'use client';

import { CheckIcon, XCircleIcon } from '@/components/icons/heroicons-shim';
import { useTranslations } from 'next-intl';
import type { FriendRequestAction } from './types';

interface ActionButtonsProps {
  isAddressee: boolean;
  actionLoading: FriendRequestAction | null;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
}

export function ActionButtons({
  isAddressee,
  actionLoading,
  onAccept,
  onReject,
  onCancel,
}: ActionButtonsProps) {
  const t = useTranslations('friendships.detailModal');

  return (
    <div className="space-y-3">
      {isAddressee ? (
        // Si eres el destinatario: mostrar Aceptar y Rechazar
        <>
          <button
            onClick={onAccept}
            disabled={actionLoading !== null}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'accept' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('accepting')}</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-5 h-5" />
                <span>{t('acceptRequest')}</span>
              </>
            )}
          </button>

          <button
            onClick={onReject}
            disabled={actionLoading !== null}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'reject' ? (
              <>
                <div className="w-4 h-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                <span>{t('rejecting')}</span>
              </>
            ) : (
              <>
                <XCircleIcon className="w-5 h-5" />
                <span>{t('reject')}</span>
              </>
            )}
          </button>
        </>
      ) : (
        // Si eres el remitente: mostrar solo Cancelar
        <button
          onClick={onCancel}
          disabled={actionLoading !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {actionLoading === 'cancel' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('cancelling')}</span>
            </>
          ) : (
            <>
              <XCircleIcon className="w-5 h-5" />
              <span>{t('cancelRequest')}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
