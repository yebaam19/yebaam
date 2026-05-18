'use client';

import { useTranslations } from 'next-intl';
import {
  CheckCircleIcon,
  EllipsisHorizontalIcon,
  UserGroupIcon,
} from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { FriendsDropdown } from './FriendsDropdown';
import { LoadingSpinner } from './LoadingSpinner';
import { UnfriendConfirmDialog } from './UnfriendConfirmDialog';
import { baseButtonStyles, iconOnlySizeStyles, iconSizeStyles, sizeStyles } from './styles';
import type { ButtonBaseProps } from './types';

/** State: `friends`. Optionally renders a 3-dots dropdown + an unfriend
 *  confirmation dialog. */
export function FriendsButton({
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
  const t = useTranslations('friendships.friendButton');
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
            className,
          )}
          title={t('friendsTitle')}
        >
          {isLoading ? (
            <LoadingSpinner className={iconSizeStyles[size]} />
          ) : (
            <CheckCircleIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
          )}
        </button>
        {showDropdown && showOptions && (
          <FriendsDropdown onUnfriend={onShowUnfriendConfirm} onClose={onToggleOptions} />
        )}
        {showUnfriendConfirm && (
          <UnfriendConfirmDialog onConfirm={onUnfriend} onCancel={onCancelUnfriend} />
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
          className,
        )}
        title={t('friendsTitle')}
      >
        {isLoading ? (
          <LoadingSpinner className={cn(iconSizeStyles[size], 'shrink-0')} />
        ) : (
          <UserGroupIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
        )}
        {variant !== 'compact' && <span>{t('friends')}</span>}
        {showDropdown && <EllipsisHorizontalIcon className="h-4 w-4 shrink-0" />}
      </button>
      {showDropdown && showOptions && (
        <FriendsDropdown onUnfriend={onShowUnfriendConfirm} onClose={onToggleOptions} />
      )}
      {showUnfriendConfirm && (
        <UnfriendConfirmDialog onConfirm={onUnfriend} onCancel={onCancelUnfriend} />
      )}
    </div>
  );
}
