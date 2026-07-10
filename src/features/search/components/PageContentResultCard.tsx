'use client';

import Link from 'next/link';
import {
  CalendarDaysIcon,
  DocumentTextIcon,
  MapPinIcon,
  MicrophoneIcon,
  NewspaperIcon,
} from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import type { Route } from 'next';
import type {
  PageArticleSearchResult,
  PageAuditionSearchResult,
  PageEventSearchResult,
  PagePostSearchResult,
} from '../interfaces/search.interfaces';

type PageContentResult =
  | { kind: 'post'; item: PagePostSearchResult }
  | { kind: 'article'; item: PageArticleSearchResult }
  | { kind: 'event'; item: PageEventSearchResult }
  | { kind: 'audition'; item: PageAuditionSearchResult };

type PageContentResultCardProps = PageContentResult & { className?: string };

const KIND_ICONS = {
  post: DocumentTextIcon,
  article: NewspaperIcon,
  event: CalendarDaysIcon,
  audition: MicrophoneIcon,
} as const;

/**
 * Card genérica para contenido de Páginas en la búsqueda: publicaciones,
 * artículos, eventos y audiciones. Los posts enlazan a su permalink
 * (/feed/post/[postId]); el resto abre la Página en la pestaña/sección
 * correspondiente (?tab= / ?seccion=, ver pageUrlState). Sin página visible
 * (page: null) el resultado se pinta sin enlace.
 *
 * @example
 * <PageContentResultCard kind="event" item={eventResult} />
 */
export function PageContentResultCard({ kind, item, className = '' }: PageContentResultCardProps) {
  const t = useTranslations('search.content');
  const locale = useLocale();
  const Icon = KIND_ICONS[kind];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    const intlLocale = locale === 'en' ? 'en-US' : 'es-ES';
    return date.toLocaleDateString(intlLocale, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const title = kind === 'post' ? item.content : item.title;
  const snippet = kind === 'article' ? item.description : null;
  const date =
    kind === 'post'
      ? formatDate(item.createdAt)
      : kind === 'article'
        ? formatDate(item.publishedAt)
        : formatDate(item.startsAt);
  const location = kind === 'event' ? item.place : kind === 'audition' ? item.city : null;

  const href: Route | null =
    kind === 'post'
      ? (`/feed/post/${item.id}` as Route)
      : item.page
        ? kind === 'article'
          ? (`/paginas/${item.page.slug}?tab=articulos` as Route)
          : (`/paginas/${item.page.slug}?seccion=${kind === 'event' ? 'eventos' : 'audiciones'}` as Route)
        : null;

  const body = (
    <div className="flex items-start gap-3">
      {/* Icono del tipo de contenido */}
      <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg shrink-0">
        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-500" />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white line-clamp-2">{title}</p>

        {snippet && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{snippet}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-primary-600 dark:text-primary-500">{t(kind)}</span>
          {item.page && <span className="truncate">{t('onPage', { name: item.page.name })}</span>}
          {location && (
            <span className="flex items-center gap-0.5">
              <MapPinIcon className="h-3.5 w-3.5" />
              {location}
            </span>
          )}
          {date && <span>{date}</span>}
        </div>
      </div>
    </div>
  );

  const cardClass = cn(
    'block p-4 rounded-lg border border-gray-200 dark:border-neutral-700',
    'transition-colors',
    href && 'hover:bg-gray-50 dark:hover:bg-neutral-800/50',
    className
  );

  if (!href) return <div className={cardClass}>{body}</div>;
  return (
    <Link href={href} className={cardClass}>
      {body}
    </Link>
  );
}
