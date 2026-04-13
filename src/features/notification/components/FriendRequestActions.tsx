/**
 * FriendRequestActions
 * 
 * Componente para los botones de aceptar/rechazar solicitudes de amistad
 * y mensajes de confirmación
 */

import { XMarkIcon, CheckIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';

interface FriendRequestActionsProps {
  isProcessing: boolean;
  isAccepted: boolean;
  isRejected: boolean;
  onAccept: (e: React.MouseEvent) => void;
  onReject: (e: React.MouseEvent) => void;
}

export default function FriendRequestActions({
  isProcessing,
  isAccepted,
  isRejected,
  onAccept,
  onReject,
}: FriendRequestActionsProps) {
  // Mostrar mensaje de confirmación si fue aceptada
  if (isAccepted) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
        <CheckIcon className="h-5 w-5" />
        ¡Ahora son amigos!
      </div>
    );
  }

  // Mostrar mensaje si fue rechazada
  if (isRejected) {
    return (
      <div className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        Solicitud rechazada
      </div>
    );
  }

  // Mostrar botones de aceptar/rechazar
  return (
    <div className="mt-3 flex gap-2">
      <button
        onClick={onAccept}
        disabled={isProcessing}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          'bg-primary-600 text-white hover:bg-primary-700',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isProcessing ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            <CheckIcon className="h-4 w-4" />
            Aceptar
          </>
        )}
      </button>
      
      <button
        onClick={onReject}
        disabled={isProcessing}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          'bg-neutral-200 text-neutral-700 hover:bg-neutral-300',
          'dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isProcessing ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
        ) : (
          <>
            <XMarkIcon className="h-4 w-4" />
            Rechazar
          </>
        )}
      </button>
    </div>
  );
}
