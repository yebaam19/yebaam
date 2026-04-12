/**
 * FriendButton Component
 *
 * Botón reutilizable y reactivo para gestionar el estado de amistad entre usuarios.
 * Maneja todos los estados: sin relación, solicitud enviada, solicitud recibida, amigos.
 * 
 * Este componente sigue los principios de Clean Architecture y SOLID:
 * - Se suscribe directamente al store de Zustand para ser reactivo
 * - Solo necesita el userId como prop principal
 * - Maneja toda su lógica internamente sin depender del componente padre
 * - Es autónomo y reutilizable en cualquier parte de la aplicación
 *
 * @example
 * // Uso básico - solo necesitas el userId
 * <FriendButton userId="user-123" />
 *
 * // Con variante compacta
 * <FriendButton userId="user-123" variant="compact" />
 *
 * // Solo ícono
 * <FriendButton userId="user-123" variant="icon" />
 *
 * // Con dropdown de opciones
 * <FriendButton userId="user-123" showDropdown />
 */

'use client';

import { cn } from '@/lib/utils';
import {
  CheckIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
  UserMinusIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import { useCallback, useState, useMemo } from 'react';
import { useFriendshipsStore } from '../store/friendships.store';

// ============================================================================
// TYPES
// ============================================================================

export type FriendButtonVariant = 'default' | 'compact' | 'icon' | 'outline';
export type FriendButtonSize = 'sm' | 'md' | 'lg';

export type FriendshipState =
  | 'none' // Sin relación
  | 'pending-sent' // Solicitud enviada por mí
  | 'pending-received' // Solicitud recibida
  | 'friends'; // Ya son amigos

export interface FriendButtonProps {
  /** ID del usuario objetivo */
  userId: string;
  /** Variante visual del botón */
  variant?: FriendButtonVariant;
  /** Tamaño del botón */
  size?: FriendButtonSize;
  /** Clase CSS adicional */
  className?: string;
  /** Mostrar dropdown con más opciones */
  showDropdown?: boolean;
  /** Callback cuando se envía solicitud (opcional) */
  onRequestSent?: (userId: string) => void;
  /** Callback cuando se cancela solicitud (opcional) */
  onRequestCancelled?: (friendshipId: string) => void;
  /** Callback cuando se acepta solicitud (opcional) */
  onRequestAccepted?: (friendshipId: string) => void;
  /** Callback cuando se rechaza solicitud (opcional) */
  onRequestRejected?: (friendshipId: string) => void;
  /** Callback cuando se elimina amigo (opcional) */
  onUnfriended?: (friendshipId: string) => void;
}

// ============================================================================
// SIZE STYLES
// ============================================================================

const sizeStyles: Record<FriendButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

const baseButtonStyles =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const iconSizeStyles: Record<FriendButtonSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const iconOnlySizeStyles: Record<FriendButtonSize, string> = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FriendButton({
  userId,
  variant = 'default',
  size = 'md',
  className,
  showDropdown = false,
  onRequestSent,
  onRequestCancelled,
  onRequestAccepted,
  onRequestRejected,
  onUnfriended,
}: FriendButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Suscribirse al store para obtener el estado de amistad de forma reactiva
  const getFriendshipStatus = useFriendshipsStore((state) => state.getFriendshipStatus);
  const friends = useFriendshipsStore((state) => state.friends);
  const sentRequests = useFriendshipsStore((state) => state.sentRequests);
  const pendingRequests = useFriendshipsStore((state) => state.pendingRequests);
  const isInitialized = useFriendshipsStore((state) => state.isInitialized);

  // Store actions
  const { sendFriendRequest, cancelFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } =
    useFriendshipsStore();

  // Calcular el estado actual de forma reactiva usando el store
  const currentState = useMemo(() => {
    return getFriendshipStatus(userId);
  }, [getFriendshipStatus, userId, friends, sentRequests, pendingRequests]);

  // Obtener el friendshipId según el estado actual
  const friendshipId = useMemo(() => {
    if (currentState === 'friends') {
      const friend = friends.find(f => f.friendId === userId);
      return friend?.friendshipId;
    }
    if (currentState === 'pending-sent') {
      const request = sentRequests.find(r => r.addresseeId === userId && r.status === 'pending');
      return request?.id;
    }
    if (currentState === 'pending-received') {
      const request = pendingRequests.find(r => r.requesterId === userId && r.status === 'pending');
      return request?.id;
    }
    return undefined;
  }, [currentState, userId, friends, sentRequests, pendingRequests]);

  // Handlers
  const handleSendRequest = useCallback(async () => {
    setIsLoading(true);
    try {
      await sendFriendRequest({ addresseeId: userId });
      onRequestSent?.(userId);
    } catch (error) {
      // Error handled by store with toast
    } finally {
      setIsLoading(false);
    }
  }, [userId, sendFriendRequest, onRequestSent]);

  const handleCancelRequest = useCallback(async () => {
    if (!friendshipId) return;
    setIsLoading(true);
    try {
      await cancelFriendRequest(friendshipId);
      onRequestCancelled?.(friendshipId);
    } catch (error) {
      // Error handled by store with toast
    } finally {
      setIsLoading(false);
    }
  }, [friendshipId, cancelFriendRequest, onRequestCancelled]);

  const handleAcceptRequest = useCallback(async () => {
    if (!friendshipId) return;
    setIsLoading(true);
    try {
      await acceptFriendRequest(friendshipId);
      onRequestAccepted?.(friendshipId);
    } catch (error) {
      // Error handled by store with toast
    } finally {
      setIsLoading(false);
    }
  }, [friendshipId, acceptFriendRequest, onRequestAccepted]);

  const handleRejectRequest = useCallback(async () => {
    if (!friendshipId) return;
    setIsLoading(true);
    try {
      await rejectFriendRequest(friendshipId);
      onRequestRejected?.(friendshipId);
    } catch (error) {
      // Error handled by store with toast
    } finally {
      setIsLoading(false);
    }
  }, [friendshipId, rejectFriendRequest, onRequestRejected]);

  const handleUnfriend = useCallback(async () => {
    if (!friendshipId) return;
    setIsLoading(true);
    try {
      await removeFriend(friendshipId);
      onUnfriended?.(friendshipId);
      setShowOptions(false);
    } catch (error) {
      // Error handled by store with toast
    } finally {
      setIsLoading(false);
    }
  }, [friendshipId, removeFriend, onUnfriended]);

  // Mostrar skeleton mientras se cargan los datos
  if (!isInitialized) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 px-4 py-2 text-sm font-medium whitespace-nowrap h-10 w-32',
          'animate-shimmer bg-size-[200%_100%]',
          className
        )}
      />
    );
  }

  // Render según estado
  switch (currentState) {
    case 'none':
      return (
        <AddFriendButton
          variant={variant}
          size={size}
          isLoading={isLoading}
          onClick={handleSendRequest}
          className={className}
        />
      );

    case 'pending-sent':
      return (
        <PendingSentButton
          variant={variant}
          size={size}
          isLoading={isLoading}
          onClick={handleCancelRequest}
          className={className}
          isHovering={isHovering}
          onHoverChange={setIsHovering}
        />
      );

    case 'pending-received':
      return (
        <PendingReceivedButtons
          variant={variant}
          size={size}
          isLoading={isLoading}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
          className={className}
        />
      );

    case 'friends':
      return (
        <FriendsButton
          variant={variant}
          size={size}
          isLoading={isLoading}
          showDropdown={showDropdown}
          showOptions={showOptions}
          showUnfriendConfirm={showUnfriendConfirm}
          onToggleOptions={() => setShowOptions(!showOptions)}
          onUnfriend={handleUnfriend}
          onShowUnfriendConfirm={() => setShowUnfriendConfirm(true)}
          onCancelUnfriend={() => setShowUnfriendConfirm(false)}
          className={className}
        />
      );

    default:
      return null;
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ButtonBaseProps {
  variant: FriendButtonVariant;
  size: FriendButtonSize;
  isLoading: boolean;
  className?: string;
}

/**
 * Botón para agregar amigo (estado: none)
 */
function AddFriendButton({ variant, size, isLoading, onClick, className }: ButtonBaseProps & { onClick: () => void; }) {
  const buttonStyles = cn(baseButtonStyles, 'focus:ring-primary-500', sizeStyles[size]);

  if (variant === 'icon') {
    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        className={cn(
          'rounded-lg bg-primary-600 text-white hover:bg-primary-700 active:scale-95',
          'focus:ring-2 focus:ring-primary-500 focus:outline-none',
          'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200 ease-in-out',
          'shadow-sm hover:shadow-md',
          iconOnlySizeStyles[size],
          className
        )}
        title="Enviar solicitud de amistad"
      >
        {isLoading ? (
          <LoadingSpinner className={iconSizeStyles[size]} />
        ) : (
          <UserPlusIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
        )}
      </button>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        className={cn(
          buttonStyles,
          'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:scale-95',
          'dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20',
          'cursor-pointer transition-all duration-200 ease-in-out',
          className
        )}
        title="Enviar solicitud de amistad"
      >
        {isLoading ? (
          <LoadingSpinner className={cn(iconSizeStyles[size], 'shrink-0')} />
        ) : (
          <UserPlusIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
        )}
        <span>Agregar amigo</span>
      </button>
    );
  }

  // default and compact variants
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        buttonStyles,
        'bg-primary-600 text-white hover:bg-primary-700 active:scale-95',
        'cursor-pointer transition-all duration-200 ease-in-out shadow-sm hover:shadow-md',
        className
      )}
      title="Enviar solicitud de amistad"
    >
      {isLoading ? (
        <LoadingSpinner className={cn(iconSizeStyles[size], 'shrink-0')} />
      ) : (
        <UserPlusIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
      )}
      {variant !== 'compact' && <span>Agregar amigo</span>}
    </button>
  );
}

/**
 * Botón para solicitud enviada (estado: pending_sent)
 */
function PendingSentButton({
  variant,
  size,
  isLoading,
  onClick,
  className,
  isHovering,
  onHoverChange,
}: ButtonBaseProps & {
  onClick: () => void;
  isHovering: boolean;
  onHoverChange: (hovering: boolean) => void;
}) {
  const buttonStyles = cn(baseButtonStyles, 'focus:ring-yellow-500', sizeStyles[size]);

  if (variant === 'icon') {
    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        className={cn(
          'rounded-lg transition-all duration-200 ease-in-out active:scale-95',
          'focus:ring-2 focus:ring-yellow-500 focus:outline-none',
          'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
          isHovering
            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50',
          iconOnlySizeStyles[size],
          className
        )}
        title={isHovering ? 'Cancelar solicitud' : 'Solicitud pendiente'}
      >
        {isLoading ? (
          <LoadingSpinner className={iconSizeStyles[size]} />
        ) : isHovering ? (
          <XMarkIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
        ) : (
          <ClockIcon className={cn(iconSizeStyles[size], 'shrink-0', 'animate-pulse')} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      className={cn(
        buttonStyles,
        'cursor-pointer transition-all duration-200 ease-in-out active:scale-95',
        isHovering
          ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50',
        className
      )}
      title={isHovering ? 'Clic para cancelar' : 'Solicitud pendiente de aceptación'}
    >
      {isLoading ? (
        <LoadingSpinner className={cn(iconSizeStyles[size], 'shrink-0')} />
      ) : isHovering ? (
        <XMarkIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
      ) : (
        <ClockIcon className={cn(iconSizeStyles[size], 'shrink-0', 'animate-pulse')} />
      )}
      {variant !== 'compact' && <span>{isHovering ? 'Cancelar solicitud' : 'Solicitud enviada'}</span>}
    </button>
  );
}

/**
 * Botones para solicitud recibida (estado: pending_received)
 */
function PendingReceivedButtons({
  variant,
  size,
  isLoading,
  onAccept,
  onReject,
  className,
}: ButtonBaseProps & { onAccept: () => void; onReject: () => void; }) {
  const acceptButtonStyles = cn(baseButtonStyles, 'focus:ring-green-500', sizeStyles[size]);
  const rejectButtonStyles = cn(baseButtonStyles, 'focus:ring-red-500', sizeStyles[size]);

  if (variant === 'icon') {
    return (
      <div className={cn('flex gap-1.5', className)}>
        <button
          onClick={onAccept}
          disabled={isLoading}
          className={cn(
            'rounded-lg bg-green-600 text-white hover:bg-green-700 active:scale-95',
            'focus:ring-2 focus:ring-green-500 focus:outline-none',
            'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200 ease-in-out shadow-sm hover:shadow-md',
            iconOnlySizeStyles[size]
          )}
          title="Aceptar solicitud de amistad"
        >
          {isLoading ? (
            <LoadingSpinner className={iconSizeStyles[size]} />
          ) : (
            <CheckIcon className={cn(iconSizeStyles[size], 'shrink-0 stroke-[2.5]')} />
          )}
        </button>
        <button
          onClick={onReject}
          disabled={isLoading}
          className={cn(
            'rounded-lg bg-red-100 text-red-700 hover:bg-red-200 active:scale-95',
            'dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
            'focus:ring-2 focus:ring-red-500 focus:outline-none',
            'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200 ease-in-out',
            iconOnlySizeStyles[size]
          )}
          title="Rechazar solicitud"
        >
          <XMarkIcon className={cn(iconSizeStyles[size], 'shrink-0 stroke-[2.5]')} />
        </button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-2', className)}>
        <button
          onClick={onAccept}
          disabled={isLoading}
          className={cn(
            acceptButtonStyles,
            'bg-green-600 text-white hover:bg-green-700 active:scale-95',
            'cursor-pointer transition-all duration-200 ease-in-out shadow-sm hover:shadow-md'
          )}
          title="Aceptar solicitud"
        >
          {isLoading ? (
            <LoadingSpinner className={cn(iconSizeStyles[size], 'shrink-0')} />
          ) : (
            <CheckIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
          )}
          <span>Aceptar</span>
        </button>
        <button
          onClick={onReject}
          disabled={isLoading}
          className={cn(
            rejectButtonStyles,
            'bg-red-100 text-red-700 hover:bg-red-200 active:scale-95',
            'dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
            'cursor-pointer transition-all duration-200 ease-in-out'
          )}
          title="Rechazar solicitud"
        >
          <XMarkIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <button
        onClick={onAccept}
        disabled={isLoading}
        className={cn(
          acceptButtonStyles,
          'bg-green-600 text-white hover:bg-green-700 active:scale-95',
          'cursor-pointer transition-all duration-200 ease-in-out shadow-sm hover:shadow-md'
        )}
        title="Aceptar solicitud de amistad"
      >
        {isLoading ? (
          <LoadingSpinner className={cn(iconSizeStyles[size], 'shrink-0')} />
        ) : (
          <CheckIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
        )}
        <span>Aceptar</span>
      </button>
      <button
        onClick={onReject}
        disabled={isLoading}
        className={cn(
          rejectButtonStyles,
          'bg-red-100 text-red-700 hover:bg-red-200 active:scale-95',
          'dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
          'cursor-pointer transition-all duration-200 ease-in-out'
        )}
        title="Rechazar solicitud"
      >
        <XMarkIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
        <span>Rechazar</span>
      </button>
    </div>
  );
}

/**
 * Botón para ya son amigos (estado: friends)
 */
function FriendsButton({
  variant,
  size,
  isLoading,
  showDropdown,
  showOptions,
  showUnfriendConfirm,
  onToggleOptions,
  onUnfriend,
  onShowUnfriendConfirm,
  onCancelUnfriend,
  className,
}: ButtonBaseProps & {
  showDropdown: boolean;
  showOptions: boolean;
  showUnfriendConfirm: boolean;
  onToggleOptions: () => void;
  onUnfriend: () => void;
  onShowUnfriendConfirm: () => void;
  onCancelUnfriend: () => void;
}) {
  const buttonStyles = cn(baseButtonStyles, 'focus:ring-green-500', sizeStyles[size]);

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={showDropdown ? onToggleOptions : undefined}
          disabled={isLoading}
          className={cn(
            'rounded-lg bg-green-100 text-green-700 hover:bg-green-200 active:scale-95',
            'dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50',
            'focus:ring-2 focus:ring-green-500 focus:outline-none',
            'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200 ease-in-out',
            iconOnlySizeStyles[size],
            className
          )}
          title="Son amigos"
        >
          {isLoading ? (
            <LoadingSpinner className={iconSizeStyles[size]} />
          ) : (
            <CheckCircleIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
          )}
        </button>
        {showDropdown && showOptions && (
          <FriendsDropdown
            onUnfriend={onShowUnfriendConfirm}
            onClose={onToggleOptions}
          />
        )}
        {showUnfriendConfirm && (
          <UnfriendConfirmDialog
            onConfirm={onUnfriend}
            onCancel={onCancelUnfriend}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={showDropdown ? onToggleOptions : undefined}
        disabled={isLoading}
        className={cn(
          buttonStyles,
          'bg-green-100 text-green-700 hover:bg-green-200 active:scale-95',
          'dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50',
          'cursor-pointer transition-all duration-200 ease-in-out',
          className
        )}
        title="Son amigos"
      >
        {isLoading ? (
          <LoadingSpinner className={cn(iconSizeStyles[size], 'shrink-0')} />
        ) : (
          <UserGroupIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
        )}
        {variant !== 'compact' && <span>Amigos</span>}
        {showDropdown && <EllipsisHorizontalIcon className="h-4 w-4 shrink-0" />}
      </button>
      {showDropdown && showOptions && (
        <FriendsDropdown
          onUnfriend={onShowUnfriendConfirm}
          onClose={onToggleOptions}
        />
      )}
      {showUnfriendConfirm && (
        <UnfriendConfirmDialog
          onConfirm={onUnfriend}
          onCancel={onCancelUnfriend}
        />
      )}
    </div>
  );
}

/**
 * Dropdown de opciones para amigos
 */
function FriendsDropdown({ onUnfriend, onClose }: { onUnfriend: () => void; onClose: () => void; }) {
  return (
    <>
      {/* Overlay para cerrar */}
      <div className="fixed inset-0 z-10" onClick={onClose} />

      {/* Dropdown */}
      <div className="ring-opacity-5 absolute top-full right-0 z-20 mt-2 w-56 rounded-lg bg-white py-1.5 shadow-xl ring-1 ring-black/10 dark:bg-gray-800 dark:ring-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
        <button
          onClick={onUnfriend}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-150 cursor-pointer"
        >
          <UserMinusIcon className="h-4 w-4 shrink-0" />
          <span>Eliminar de amigos</span>
        </button>
      </div>
    </>
  );
}

/**
 * Diálogo de confirmaci��n para eliminar amigo
 */
function UnfriendConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void; }) {
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" onClick={onCancel} />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-4 rounded-lg bg-white p-6 shadow-2xl dark:bg-gray-800">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <UserMinusIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                ¿Eliminar de amigos?
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Esta persona dejará de aparecer en tu lista de amigos. Podrás enviarle otra solicitud más tarde.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 active:scale-95 transition-all duration-150 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Spinner de carga
 */
function LoadingSpinner({ className }: { className?: string; }) {
  return (
    <svg className={cn('animate-spin', className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default FriendButton;
