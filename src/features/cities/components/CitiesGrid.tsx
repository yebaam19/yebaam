'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/heroicons-shim';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import type { CitiesPage } from '../server/cities.server';
import { primaryActionStyles } from '@/ui/primary-action-styles';
import { CityCard } from './CityCard';

/** Server-bounded pagination keeps every city reachable without downloading the catalog. */
export function CitiesGrid({ items, total, page, pageSize, error }: CitiesPage) {
  const t = useTranslations('cities.list');
  const tCard = useTranslations('cities.card');
  const tGrid = useTranslations('cities.grid');
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const totalPages = Math.ceil(total / pageSize);
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  if (start > 1) pages.unshift(1);
  if (pages.at(-1)! < totalPages) pages.push(totalPages);

  const changePage = (nextPage: number) => {
    if (nextPage === page) return;
    const next = new URLSearchParams(params.toString());
    if (nextPage > 1) next.set('page', String(nextPage)); else next.delete('page');
    startTransition(() => router.replace((next.size ? `${pathname}?${next}` : pathname) as Route, { scroll: false }));
  };

  if (error || items.length === 0) return (
    <section id="city-results" className="space-y-4 rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
      <p role={error ? 'alert' : 'status'} className="text-sm text-neutral-600 dark:text-neutral-300">{t(error ? 'loadError' : 'empty')}</p>
      {error ? <button type="button" className={`${primaryActionStyles} px-4 py-2 text-sm`} onClick={() => router.refresh()}>{t('retry')}</button>
        : <Link href="/cities" className={`${primaryActionStyles} inline-flex items-center px-4 py-2 text-sm`}>{t('clearFilters')}</Link>}
    </section>
  );

  return (
    <section id="city-results" aria-label={t('resultsLabel')} aria-busy={pending} className="space-y-4">
      <p role="status" className="text-sm text-neutral-600 dark:text-neutral-400">{t('resultCount', { count: total })}</p>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {items.map((city) => <CityCard key={city.id} city={city} exploreLabel={tCard('explore')} />)}
      </div>
      {totalPages > 1 && <nav aria-label={t('paginationLabel')} className="flex flex-wrap items-center justify-center gap-2 pt-4">
        <button type="button" disabled={pending || page <= 1} onClick={() => changePage(page - 1)} aria-label={tGrid('previous')}
          className="flex size-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200"><ChevronLeftIcon className="size-4" /></button>
        {pages.map((value) => <button key={value} type="button" disabled={pending} onClick={() => changePage(value)}
          aria-current={value === page ? 'page' : undefined}
          className={`size-10 rounded-full text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary-800 ${value === page
            ? 'bg-primary-600 text-white' : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800'}`}>{value}</button>)}
        <button type="button" disabled={pending || page >= totalPages} onClick={() => changePage(page + 1)} aria-label={tGrid('next')}
          className="flex size-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200"><ChevronRightIcon className="size-4" /></button>
      </nav>}
    </section>
  );
}
