/**
 * Public types for the FriendButton component family. The parent
 * `FriendButton.tsx` re-exports the public-surface names so existing import
 * paths (`@/features/friendships/components/FriendButton`, the feature
 * barrel `@/features/friendships`) keep working unchanged.
 */

export type FriendButtonVariant = 'default' | 'compact' | 'icon' | 'outline';
export type FriendButtonSize = 'sm' | 'md' | 'lg';

/** The four observable states the button switches between. */
export type FriendshipState =
  | 'none'
  | 'pending-sent'
  | 'pending-received'
  | 'friends';

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

/** Props common to every variant subcomponent. */
export interface ButtonBaseProps {
  variant: FriendButtonVariant;
  size: FriendButtonSize;
  isLoading: boolean;
  className?: string;
}
