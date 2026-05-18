'use client';

import { useTranslations } from 'next-intl';
import { UserPlusIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';
import { baseButtonStyles, iconOnlySizeStyles, iconSizeStyles, sizeStyles } from './styles';
import type { ButtonBaseProps } from './types';

/** Botón para agregar amigo (estado: `none`). */
export function AddFriendButton({
  variant,
  size,
  isLoading,
  onClick,
  className,
}: ButtonBaseProps & { onClick: () => void }) {
  const t = useTranslations('friendships.friendButton');
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
          'transition-all duration-200 ease-in-out shadow-sm hover:shadow-md',
          iconOnlySizeStyles[size],
          className,
        )}
        title={t('addFriendTitle')}
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
          className,
        )}
        title={t('addFriendTitle')}
      >
        {isLoading ? (
          <LoadingSpinner className={cn(iconSizeStyles[size], 'shrink-0')} />
        ) : (
          <UserPlusIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
        )}
        <span>{t('addFriend')}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        buttonStyles,
        'bg-primary-600 text-white hover:bg-primary-700 active:scale-95',
        'cursor-pointer transition-all duration-200 ease-in-out shadow-sm hover:shadow-md',
        className,
      )}
      title={t('addFriendTitle')}
    >
      {isLoading ? (
        <LoadingSpinner className={cn(iconSizeStyles[size], 'shrink-0')} />
      ) : (
        <UserPlusIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
      )}
      {variant !== 'compact' && <span>{t('addFriend')}</span>}
    </button>
  );
}
