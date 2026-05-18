'use client';

/**
 * Two-kind chip filter for /cities/[slug]/social-help. URL is the source of
 * truth — same pattern as `ClassifiedsToolbar` minus the search input.
 */

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import type { HelpKind } from '@/features/cities/server/social-help.server';

const KINDS: HelpKind[] = ['offer', 'need'];

export function HelpToolbar() {
  const t = useTranslations('cities.socialHelp');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlKind = searchParams.get('kind') as HelpKind | null;

  const setKind = (kind: HelpKind | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (kind) next.set('kind', kind);
    else next.delete('kind');
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}` as Route);
    });
  };

  return (
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
  );
}
