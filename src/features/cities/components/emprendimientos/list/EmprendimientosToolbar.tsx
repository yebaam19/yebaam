'use client';

/** URL-owned tipo filtering with the shared cancellable search scheduler. */

import { useUrlSearch } from '@/lib/hooks/useUrlSearch';
import { useTranslations } from 'next-intl';
import { MagnifyingGlassIcon } from '@/components/icons/heroicons-shim';
import {
  EMPRENDIMIENTO_CATEGORIES,
  EMPRENDIMIENTO_CATEGORY_EMOJI,
  type EmprendimientoCategory,
} from '@/features/cities/data/emprendimientos';

const ACTIVE_CHIP =
  'rounded-full bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm';
const IDLE_CHIP =
  'rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700';

export function EmprendimientosToolbar() {
  const t = useTranslations('cities.emprendimientos');
  const search = useUrlSearch();
  const searchParams = search.params;

  const urlCategory = searchParams.get('tipo') as EmprendimientoCategory | null;
  const setCategory = (value: EmprendimientoCategory | null) => search.setFilters({ tipo: value });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          aria-pressed={!urlCategory}
          className={!urlCategory ? ACTIVE_CHIP : IDLE_CHIP}
        >
          {t('toolbar.all')}
        </button>
        {EMPRENDIMIENTO_CATEGORIES.map((category) => {
          const active = urlCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setCategory(category)}
              aria-pressed={active}
              className={active ? ACTIVE_CHIP : IDLE_CHIP}
            >
              <span aria-hidden="true">{EMPRENDIMIENTO_CATEGORY_EMOJI[category]}</span>{' '}
              {t(`categories.${category}`)}
            </button>
          );
        })}
      </div>
      <label className="relative flex w-full max-w-xs items-center sm:w-auto">
        <span className="sr-only">{t('toolbar.searchPlaceholder')}</span>
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 h-4 w-4 text-neutral-400" />
        <input
          type="search"
          value={search.query}
          onChange={(e) => search.changeQuery(e.target.value)}
          placeholder={t('toolbar.searchPlaceholder')}
          className="block w-full rounded-full border border-neutral-300 bg-white py-1.5 pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
        />
      </label>
    </div>
  );
}
