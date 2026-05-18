import { createElement } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  ArrowLeftIcon,
  WrenchScrewdriverIcon,
} from '@/components/icons/heroicons-shim';
import { getPortalIcon } from './icons';
import { PORTAL_SECTIONS } from '@/features/cities/data/portal-sections';

interface PortalUnderConstructionProps {
  /**
   * Stable id of the portal section this page belongs to — must match an
   * entry in `PORTAL_SECTIONS`. The label and icon are read from there so
   * a single source of truth drives both the tile and the empty state.
   */
  sectionId: string;
  citySlug: string;
}

/**
 * Polished empty-state rendered at every portal route whose Phase has not
 * shipped yet. RSC by design — zero client JS, so the bundle stays tiny
 * and the page is Lighthouse-friendly even when 20 of these exist.
 */
export async function PortalUnderConstruction({
  sectionId,
  citySlug,
}: PortalUnderConstructionProps) {
  const t = await getTranslations('cities.portal');
  const section = PORTAL_SECTIONS.find((s) => s.id === sectionId);
  const iconComponent = section
    ? getPortalIcon(section.icon)
    : WrenchScrewdriverIcon;
  const label = section ? t(`sections.${section.id}.label`) : '';

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <div className="rounded-full bg-primary-50 p-4 dark:bg-primary-900/30">
        {createElement(iconComponent, {
          className: 'h-10 w-10 text-primary-600 dark:text-primary-400',
        })}
      </div>
      {label && (
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
          {label}
        </h2>
      )}
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
        {t('underConstruction.title')}
      </h3>
      <p className="max-w-md text-sm text-neutral-600 dark:text-neutral-400 sm:text-base">
        {t('underConstruction.subtitle')}
      </p>
      <Link
        href={`/cities/${citySlug}` as Route}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>{t('underConstruction.backToPortal')}</span>
      </Link>
    </div>
  );
}
