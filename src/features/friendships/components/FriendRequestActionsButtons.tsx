/**
 * FriendRequestActionsButtons
 * 
 * Botones de acción para solicitudes de amistad
 * Diseño inline estilo Facebook
 */

'use client';

import { ArrowPathIcon, CheckIcon, XCircleIcon } from '@/components/icons/heroicons-shim';

interface FriendRequestActionsProps {
  isAddressee: boolean; // true si eres el destinatario (puedes aceptar/rechazar)
  actionLoading: 'accept' | 'reject' | 'cancel' | null;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
}

export default function FriendRequestActionsButtons({
  isAddressee,
  actionLoading,
  onAccept,
  onReject,
  onCancel,
}: FriendRequestActionsProps) {
  if (isAddressee) {
    // Si eres el destinatario: Botones para Aceptar y Rechazar
    return (
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          disabled={actionLoading !== null}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-6 py-2 text-white font-semibold shadow-md hover:shadow-lg transition-all"
        >
          {actionLoading === 'accept' ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              <span>Aceptando...</span>
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5" />
              <span>Aceptar</span>
            </>
          )}
        </button>
        
        <button
          onClick={onReject}
          disabled={actionLoading !== null}
          className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-6 py-2 text-gray-900 font-semibold shadow-md hover:shadow-lg transition-all"
        >
          {actionLoading === 'reject' ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              <span>Rechazando...</span>
            </>
          ) : (
            <>
              <XCircleIcon className="w-5 h-5" />
              <span>Rechazar</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Si eres el remitente: Botón para Cancelar solicitud
  return (
    <button
      onClick={onCancel}
      disabled={actionLoading !== null}
      className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-6 py-2 text-gray-900 font-semibold shadow-md hover:shadow-lg transition-all"
    >
      {actionLoading === 'cancel' ? (
        <>
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
          <span>Cancelando...</span>
        </>
      ) : (
        <>
          <XCircleIcon className="w-5 h-5" />
          <span>Cancelar solicitud</span>
        </>
      )}
    </button>
  );
}
