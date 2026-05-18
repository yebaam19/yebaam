'use client';

import { useTranslations } from 'next-intl';
import { ClockIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';
import { baseButtonStyles, iconOnlySizeStyles, iconSizeStyles, sizeStyles } from './styles';
import type { ButtonBaseProps } from './types';

/** Botón para solicitud enviada (estado: `pending-sent`). Hover swaps to a
 *  red "cancel" affordance. */
export function PendingSentButton({
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
  const t = useTranslations('friendships.friendButton');
  const buttonStyles = cn(baseButtonStyles, 'focus:ring-yellow-500', sizeStyles[size]);

  const yellowToRed = isHovering
    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50';

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
          yellowToRed,
          iconOnlySizeStyles[size],
          className,
        )}
        title={isHovering ? t('cancelRequest') : t('pendingTitle')}
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
        yellowToRed,
        className,
      )}
      title={isHovering ? t('cancelOnHover') : t('pendingDescription')}
    >
      {isLoading ? (
        <LoadingSpinner className={cn(iconSizeStyles[size], 'shrink-0')} />
      ) : isHovering ? (
        <XMarkIcon className={cn(iconSizeStyles[size], 'shrink-0')} />
      ) : (
        <ClockIcon className={cn(iconSizeStyles[size], 'shrink-0', 'animate-pulse')} />
      )}
      {variant !== 'compact' && (
        <span>{isHovering ? t('cancelRequest') : t('requestSent')}</span>
      )}
    </button>
  );
}
