'use client';

/**
 * Kind chip filter + free-text search for /cities/[slug]/classifieds.
 *
 * URL is the source of truth — the chips and the search input read from
 * `useSearchParams()` and write via `router.replace()` inside
 * `useTransition`. We never mirror URL state in `useState`, which would
 * drift the moment a user navigates with back/forward.
 *
 * The search input debounces 300ms before pushing to the URL so each
 * keystroke does not trigger a re-stream; the kind chip clicks are
 * instant.
 */

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { MagnifyingGlassIcon } from '@/components/icons/heroicons-shim';
import type { ClassifiedKind } from '@/features/cities/server/classifieds.server';

const KINDS: ClassifiedKind[] = ['offer', 'want', 'trade', 'free'];

export function ClassifiedsToolbar() {
  const t = useTranslations('cities.classifieds');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlKind = searchParams.get('kind') as ClassifiedKind | null;
  const urlQ = searchParams.get('q') ?? '';

  const [localQ, setLocalQ] = useState(urlQ);

  // Keep the input in sync if the URL changes from outside (e.g. back nav).
  useEffect(() => {
    setLocalQ(urlQ);
  }, [urlQ]);

  // Debounce 300ms before pushing to the URL.
  useEffect(() => {
    if (localQ === urlQ) return;
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (localQ.trim()) next.set('q', localQ.trim());
      else next.delete('q');
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}` as Route);
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQ]);

  const setKind = (kind: ClassifiedKind | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (kind) next.set('kind', kind);
    else next.delete('kind');
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}` as Route);
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setKind(null)}
          aria-pressed={!urlKind}
          className={
            !urlKind
              ? 'rounded-full bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm'
              : 'rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
          }
        >
          {t('toolbar.all')}
        </button>
        {KINDS.map((kind) => {
          const active = urlKind === kind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => setKind(kind)}
              aria-pressed={active}
              data-kind={kind}
              className={
                active
                  ? 'rounded-full bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm'
                  : 'rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
              }
            >
              {t(`kinds.${kind}`)}
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
