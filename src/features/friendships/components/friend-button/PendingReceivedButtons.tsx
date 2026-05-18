'use client';

import { useTranslations } from 'next-intl';
import { CheckIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';
import { baseButtonStyles, iconOnlySizeStyles, iconSizeStyles, sizeStyles } from './styles';
import type { ButtonBaseProps } from './types';

/** Pair of accept/reject buttons (estado: `pending-received`). */
export function PendingReceivedButtons({
  variant,
  size,
  isLoading,
  onAccept,
  onReject,
  className,
}: ButtonBaseProps & { onAccept: () => void; onReject: () => void }) {
  const t = useTranslations('friendships.friendButton');
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
            iconOnlySizeStyles[size],
          )}
          title={t('acceptRequestTitle')}
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
            iconOnlySizeStyles[size],
          )}
          title={t('rejectTitle')}
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
            'cursor-pointer transition-all duration-200 ease-in-out shadow-sm hover:shadow-md',
          )}
          title={t('acceptTitle')}
        >
          {isLoading ? (
            <LoadingSpinner className={cn(iconSizeStyles[size], 'shrink-0')} />
          ) : (
            <CheckIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
          )}
          <span>{t('accept')}</span>
        </button>
        <button
          onClick={onReject}
          disabled={isLoading}
          className={cn(
            rejectButtonStyles,
            'bg-red-100 text-red-700 hover:bg-red-200 active:scale-95',
            'dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
            'cursor-pointer transition-all duration-200 ease-in-out',
          )}
          title={t('rejectTitle')}
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
          'cursor-pointer transition-all duration-200 ease-in-out shadow-sm hover:shadow-md',
        )}
        title={t('acceptRequestTitle')}
      >
        {isLoading ? (
          <LoadingSpinner className={cn(iconSizeStyles[size], 'shrink-0')} />
        ) : (
          <CheckIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
        )}
        <span>{t('accept')}</span>
      </button>
      <button
        onClick={onReject}
        disabled={isLoading}
        className={cn(
          rejectButtonStyles,
          'bg-red-100 text-red-700 hover:bg-red-200 active:scale-95',
          'dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
          'cursor-pointer transition-all duration-200 ease-in-out',
        )}
        title={t('rejectTitle')}
      >
        <XMarkIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
        <span>{t('reject')}</span>
      </button>
    </div>
  );
}
