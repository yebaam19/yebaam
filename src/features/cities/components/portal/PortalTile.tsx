import { createElement } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import type { PortalSection } from '@/features/cities/data/portal-sections';
import { resolveHref } from '@/features/cities/data/portal-sections';
import { getPortalIcon } from './icons';

interface PortalTileProps {
  section: PortalSection;
  citySlug: string;
  count?: number;
}

/**
 * One tile on the 27-tile portal grid. Renders as a `<Link>` when the route
 * exists (or is a Phase-2 scaffolded under-construction page) and as a
 * non-interactive card when there is genuinely nothing to land on yet —
 * but in this codebase every coming-soon route has a scaffolded page, so
 * the link path is taken in every case. The "Pronto" pill cues the user
 * that the content behind the tile is still being built.
 */
export async function PortalTile({ section, citySlug, count }: PortalTileProps) {
  const t = await getTranslations('cities.portal');
  const iconComponent = getPortalIcon(section.icon);
  const href = resolveHref(section, citySlug);
  const label = t(`sections.${section.id}.label`);

  const showCountPill = typeof count === 'number' && count > 0;
  const showComingSoonPill = section.comingSoon && !showCountPill;

  return (
    <Link
      href={href as Route}
      data-section-id={section.id}
      className="group relative flex h-full min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-600 dark:hover:bg-primary-900/20"
    >
      {createElement(iconComponent, {
        className:
          'h-7 w-7 text-primary-600 transition-colors group-hover:text-primary-700 dark:text-primary-400 dark:group-hover:text-primary-300',
      })}
      <span className="line-clamp-2 text-xs font-medium leading-tight text-neutral-800 dark:text-neutral-100 sm:text-sm">
        {label}
      </span>
      {showCountPill && (
        <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
      {showComingSoonPill && (
        <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          {t('comingSoonPill')}
        </span>
      )}
    </Link>
  );
}
