/**
 * FriendButton — reactive friendship CTA.
 *
 * Self-contained: pass `userId`, the component pulls reactive friendship
 * state from the Zustand store and renders one of four variant components
 * (`AddFriendButton`, `PendingSentButton`, `PendingReceivedButtons`,
 * `FriendsButton`) based on the derived `currentState`. All the per-variant
 * UI and the hook live under `./friend-button/`; this file is the
 * orchestration shell only.
 *
 * The public type surface (`FriendButtonProps`, `FriendButtonVariant`,
 * `FriendButtonSize`, `FriendshipState`) is re-exported below so the existing
 * import path (`@/features/friendships/components/FriendButton`) and the
 * feature barrel (`@/features/friendships`) keep working unchanged.
 *
 * @example
 * <FriendButton userId="user-123" />
 * <FriendButton userId="user-123" variant="compact" />
 * <FriendButton userId="user-123" variant="icon" showDropdown />
 */

'use client';

import { cn } from '@/lib/utils';
import { AddFriendButton } from './friend-button/AddFriendButton';
import { FriendsButton } from './friend-button/FriendsButton';
import { PendingReceivedButtons } from './friend-button/PendingReceivedButtons';
import { PendingSentButton } from './friend-button/PendingSentButton';
import type { FriendButtonProps } from './friend-button/types';
import { useFriendshipUI } from './friend-button/useFriendshipUI';

export type {
  FriendButtonProps,
  FriendButtonSize,
  FriendButtonVariant,
  FriendshipState,
} from './friend-button/types';

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
  const ui = useFriendshipUI(userId, {
    onRequestSent,
    onRequestCancelled,
    onRequestAccepted,
    onRequestRejected,
    onUnfriended,
  });

  if (!ui.isInitialized) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 px-4 py-2 text-sm font-medium whitespace-nowrap h-10 w-32',
          'animate-shimmer bg-size-[200%_100%]',
          className,
        )}
      />
    );
  }

  switch (ui.currentState) {
    case 'none':
      return (
        <AddFriendButton
          variant={variant}
          size={size}
          isLoading={ui.isLoading}
          onClick={ui.handlers.sendRequest}
          className={className}
        />
      );

    case 'pending-sent':
      return (
        <PendingSentButton
          variant={variant}
          size={size}
          isLoading={ui.isLoading}
          onClick={ui.handlers.cancelRequest}
          className={className}
          isHovering={ui.hover.isHovering}
          onHoverChange={ui.hover.setHovering}
        />
      );

    case 'pending-received':
      return (
        <PendingReceivedButtons
          variant={variant}
          size={size}
          isLoading={ui.isLoading}
          onAccept={ui.handlers.acceptRequest}
          onReject={ui.handlers.rejectRequest}
          className={className}
        />
      );

    case 'friends':
      return (
        <FriendsButton
          variant={variant}
          size={size}
          isLoading={ui.isLoading}
          showDropdown={showDropdown}
          showOptions={ui.dropdown.showOptions}
          showUnfriendConfirm={ui.dropdown.showUnfriendConfirm}
          onToggleOptions={ui.dropdown.toggleOptions}
          onUnfriend={ui.handlers.unfriend}
          onShowUnfriendConfirm={ui.dropdown.openUnfriendConfirm}
          onCancelUnfriend={ui.dropdown.cancelUnfriendConfirm}
          className={className}
        />
      );

    default:
      return null;
  }
}

export default FriendButton;
