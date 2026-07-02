import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClockIcon, PencilIcon } from '@/components/icons/heroicons-shim';
import type { EmprendimientoStatus } from '@/features/cities/server/emprendimientos.server';

interface Props {
  status: EmprendimientoStatus;
  rejectionReason: string | null;
  editHref: Route;
  /** Only owners/admins ever reach this banner; owners also get the edit CTA. */
  showEdit: boolean;
}

/** Amber "en revisión" / red "rechazado + motivo" banner above the detail. */
export async function PendingBanner({ status, rejectionReason, editHref, showEdit }: Props) {
  if (status === 'APPROVED') return null;
  const t = await getTranslations('cities.emprendimientos.pendingBanner');
  const rejected = status === 'REJECTED';

  return (
    <div
      className={
        rejected
          ? 'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-900/20'
          : 'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/20'
      }
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <ClockIcon
          className={
            rejected
              ? 'mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400'
              : 'mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400'
          }
        />
        <div className="min-w-0">
          <p
            className={
              rejected
                ? 'text-sm font-semibold text-red-800 dark:text-red-200'
                : 'text-sm font-semibold text-amber-800 dark:text-amber-200'
            }
          >
            {rejected ? t('rejectedTitle') : t('pendingTitle')}
          </p>
          <p
            className={
              rejected
                ? 'text-sm text-red-700 dark:text-red-300'
                : 'text-sm text-amber-700 dark:text-amber-300'
            }
          >
            {rejected
              ? t('rejectedBody', { reason: rejectionReason ?? t('noReason') })
              : t('pendingBody')}
          </p>
        </div>
      </div>
      {showEdit && (
        <Link
          href={editHref}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          <PencilIcon className="h-3.5 w-3.5" />
          {t('editCta')}
        </Link>
      )}
    </div>
  );
}
