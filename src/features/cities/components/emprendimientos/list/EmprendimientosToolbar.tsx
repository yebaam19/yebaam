'use client';

/**
 * Category chip filter + free-text search for /cities/[slug]/emprendimientos.
 * Same architecture as ClassifiedsToolbar: the URL is the source of truth
 * (`?tipo=&q=`), chips write instantly, search debounces 300ms, and there is
 * no useState mirror of URL state beyond the input's local buffer.
 */

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { MagnifyingGlassIcon } from '@/components/icons/heroicons-shim';
import {
  EMPRENDIMIENTO_CATEGORIES,
  type EmprendimientoCategory,
} from '@/features/cities/data/emprendimientos';

const ACTIVE_CHIP =
  'rounded-full bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm';
const IDLE_CHIP =
  'rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700';

export function EmprendimientosToolbar() {
  const t = useTranslations('cities.emprendimientos');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlCategory = searchParams.get('tipo') as EmprendimientoCategory | null;
  const urlQ = searchParams.get('q') ?? '';

  const [localQ, setLocalQ] = useState(urlQ);

  // Keep the input in sync if the URL changes from outside (e.g. back nav).
  useEffect(() => {
    setLocalQ(urlQ);
  }, [urlQ]);

  // Debounce 300ms before pushing to the URL. The timer reads the LIVE URL
  // (not the render-time searchParams) so a category-chip click landing
  // inside the debounce window is not reverted by a stale snapshot.
  useEffect(() => {
    if (localQ === urlQ) return;
    const handle = setTimeout(() => {
      const next = new URLSearchParams(window.location.search);
      if (localQ.trim()) next.set('q', localQ.trim());
      else next.delete('q');
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}` as Route);
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQ]);

  const setCategory = (category: EmprendimientoCategory | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (category) next.set('tipo', category);
    else next.delete('tipo');
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}` as Route);
    });
  };

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
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          placeholder={t('toolbar.searchPlaceholder')}
          className="block w-full rounded-full border border-neutral-300 bg-white py-1.5 pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
        />
      </label>
    </div>
  );
}
