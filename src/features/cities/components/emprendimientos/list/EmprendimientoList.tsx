import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { PlusIcon, RocketLaunchIcon } from '@/components/icons/heroicons-shim';
import type { EmprendimientoSummary } from '@/features/cities/server/emprendimientos.server';
import { EmprendimientoCard } from './EmprendimientoCard';

interface Props {
  citySlug: string;
  cityName: string;
  items: EmprendimientoSummary[];
  /** Active search term — switches the empty state to "no results". */
  q?: string;
  isFiltered: boolean;
}

/** Responsive grid + warm empty state inviting the first publication. */
export async function EmprendimientoList({ citySlug, cityName, items, q, isFiltered }: Props) {
  const t = await getTranslations('cities.emprendimientos');

  if (items.length === 0) {
    const searching = Boolean(q && q.trim());
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
          <RocketLaunchIcon className="h-7 w-7 text-primary-600 dark:text-primary-400" />
        </div>
        <p className="mt-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          {searching ? t('list.emptySearch', { q: q!.trim() }) : t('list.empty', { city: cityName })}
        </p>
        {!searching && (
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t('list.emptyHint')}
          </p>
        )}
        {isFiltered ? (
          <Link
            href={`/cities/${citySlug}/emprendimientos` as Route}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            {t('list.viewAll')}
          </Link>
        ) : (
          <Link
            href={`/cities/${citySlug}/emprendimientos/new` as Route}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4" />
            {t('header.newCta')}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <EmprendimientoCard key={item.id} citySlug={citySlug} item={item} />
      ))}
    </div>
  );
}
