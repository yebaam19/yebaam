'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { HandThumbUpIcon } from '@/components/icons/heroicons-shim';
import { toggleRecommendation } from '@/features/cities/actions/emprendimientos.actions';

interface Props {
  emprendimientoId: string;
  initialRecommended: boolean;
  initialCount: number;
  /** null when the viewer is signed out. */
  viewerId: string | null;
  loginRedirect: string;
}

const IDLE =
  'inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white dark:border-neutral-600 dark:bg-neutral-800/95 dark:text-neutral-200 dark:hover:bg-neutral-800';
const ACTIVE =
  'inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm transition-colors dark:border-primary-800 dark:bg-primary-900/40 dark:text-primary-300';

/** Optimistic "Recomendar" toggle (BusinessEngagementBar pattern). */
export function RecommendButton({
  emprendimientoId,
  initialRecommended,
  initialCount,
  viewerId,
  loginRedirect,
}: Props) {
  const t = useTranslations('cities.emprendimientos.detail');
  const [recommended, setRecommended] = useState(initialRecommended);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  if (!viewerId) {
    return (
      <Link href={`/login?redirect=${encodeURIComponent(loginRedirect)}` as Route} className={IDLE}>
        <HandThumbUpIcon className="h-4 w-4" />
        {t('recommend')}
        {count > 0 && <span className="text-xs opacity-70">· {count}</span>}
      </Link>
    );
  }

  const toggle = () => {
    if (isPending) return;
    const prev = { recommended, count };
    setRecommended(!recommended);
    setCount(count + (recommended ? -1 : 1));
    startTransition(async () => {
      const out = await toggleRecommendation({ emprendimientoId });
      if (out.ok) {
        setRecommended(out.data.hasRecommended);
        setCount(out.data.recommendationsCount);
      } else {
        setRecommended(prev.recommended);
        setCount(prev.count);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={recommended}
      className={`${recommended ? ACTIVE : IDLE} disabled:opacity-70`}
    >
      <HandThumbUpIcon className="h-4 w-4" />
      {recommended ? t('recommended') : t('recommend')}
      {count > 0 && <span className="text-xs opacity-70">· {count}</span>}
    </button>
  );
}
