import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClockIcon, PencilIcon } from '@/components/icons/heroicons-shim';
import type { EmprendimientoSummary } from '@/features/cities/server/emprendimientos.server';

interface Props {
  citySlug: string;
  /** The signed-in owner's rows for this city (any status). */
  mine: EmprendimientoSummary[];
}

/**
 * Owner-only notice on the list page: their PENDING/REJECTED rows are not in
 * the public grid, so without this banner a fresh publication looks lost.
 */
export async function MyPendingBanner({ citySlug, mine }: Props) {
  const notPublic = mine.filter((m) => m.status !== 'APPROVED');
  if (notPublic.length === 0) return null;
  const t = await getTranslations('cities.emprendimientos.pendingBanner');

  return (
    <div className="space-y-2">
      {notPublic.map((item) => {
        const rejected = item.status === 'REJECTED';
        return (
          <div
            key={item.id}
            className={
              rejected
                ? 'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-900/20'
                : 'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/20'
            }
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <ClockIcon
                className={
                  rejected
                    ? 'h-5 w-5 shrink-0 text-red-600 dark:text-red-400'
                    : 'h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400'
                }
              />
              <p
                className={
                  rejected
                    ? 'min-w-0 text-sm font-medium text-red-800 dark:text-red-200'
                    : 'min-w-0 text-sm font-medium text-amber-800 dark:text-amber-200'
                }
              >
                <span className="font-semibold">{item.name}:</span>{' '}
                {rejected ? t('rejectedTitle') : t('pendingTitle')}
              </p>
            </div>
            <Link
              href={`/cities/${citySlug}/emprendimientos/${item.id}` as Route}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              <PencilIcon className="h-3.5 w-3.5" />
              {t('editCta')}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
