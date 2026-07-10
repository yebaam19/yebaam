'use client';

import Link from 'next/link';
import { CheckBadgeIcon, FlagIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { resolveImageRef } from '@/lib/media/urls';
import type { PageSearchResult } from '../interfaces/search.interfaces';

interface PageResultCardProps {
  page: PageSearchResult;
  className?: string;
}

/**
 * Card de resultado de Página (facet `pages` de /api/search).
 * Muestra: avatar, nombre, verificación, descripción y seguidores.
 * Enlaza a /feed/paginas/[slug].
 *
 * @example
 * <PageResultCard page={pageResult} />
 */
export function PageResultCard({ page, className = '' }: PageResultCardProps) {
  const t = useTranslations('search');
  const avatarSrc = resolveImageRef(page.profileImageUrl, 'avatar');

  return (
    <Link
      href={`/feed/paginas/${page.slug}`}
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg',
        'hover:bg-gray-50 dark:hover:bg-neutral-800/50',
        'transition-colors',
        className
      )}
    >
      {/* Avatar de la página */}
      {avatarSrc ? (
        <Avatar src={avatarSrc} alt={page.name} className="h-12 w-12 shrink-0" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
          <FlagIcon className="h-6 w-6 text-primary-600 dark:text-primary-500" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{page.name}</h3>
          {page.isVerified && (
            <CheckBadgeIcon className="h-4 w-4 text-primary-600 dark:text-primary-500 shrink-0" />
          )}
        </div>

        {page.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
            {page.description}
          </p>
        )}

        {/* Copia idéntica a la de usuarios: se reutiliza search.user.followers */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('user.followers', { count: page.followerCount })}
        </p>
      </div>
    </Link>
  );
}
