'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { UserGroupIcon, ArrowLeftIcon } from '@/components/icons/heroicons-shim';

interface Props {
  /** Route prefix for the "back to groups" link (`/grupos` or `/feed/grupos`). */
  basePath: Route;
}

/** Shown when `useGroup` resolves to no group (bad id, deleted, or no access). */
export function GroupDetailNotFound({ basePath }: Props) {
  const t = useTranslations('grupos');
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <UserGroupIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          {t('detail.notFoundTitle')}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          {t('detail.notFoundDescription')}
        </p>
        <Link
          href={basePath}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          {t('detail.backToGroups')}
        </Link>
      </div>
    </div>
  );
}
