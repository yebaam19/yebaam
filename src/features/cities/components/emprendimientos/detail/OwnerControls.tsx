'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { TrashIcon } from '@/components/icons/heroicons-shim';
import { deleteEmprendimiento } from '@/features/cities/actions/emprendimientos.actions';

interface Props {
  emprendimientoId: string;
  listHref: string;
}

/** Owner-only destructive control at the bottom of the detail page. */
export function OwnerControls({ emprendimientoId, listHref }: Props) {
  const t = useTranslations('cities.emprendimientos.detail');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  const handleDelete = () => {
    if (isPending) return;
    if (!window.confirm(t('deleteConfirm'))) return;
    setError(false);
    startTransition(async () => {
      const out = await deleteEmprendimiento({ id: emprendimientoId });
      if (out.ok) {
        router.push(listHref as Route);
        router.refresh();
      } else {
        setError(true);
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
      {error && (
        <span className="text-xs font-medium text-red-600 dark:text-red-400">
          {t('deleteCta')}: ✕
        </span>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        <TrashIcon className="h-4 w-4" />
        {t('deleteCta')}
      </button>
    </div>
  );
}
