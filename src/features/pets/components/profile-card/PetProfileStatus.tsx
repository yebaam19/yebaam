'use client';

import { useTranslations } from 'next-intl';
import { HeartIcon } from '@/components/icons/heroicons-shim';
import type { PetCompleteness, SectionState } from './completeness';

interface Props {
  completeness: PetCompleteness;
}

function SectionPill({ label, state }: { label: string; state: SectionState }) {
  const ratio = state.total === 0 ? 0 : state.filled / state.total;
  const complete = ratio >= 1;
  return (
    <div
      className={`relative overflow-hidden rounded-lg border px-3 py-2 text-xs font-medium transition ${
        complete
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-200'
          : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300'
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 ${complete ? 'bg-emerald-200/50 dark:bg-emerald-700/30' : 'bg-emerald-100/60 dark:bg-emerald-900/30'}`}
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
      <span className="relative">{label}</span>
    </div>
  );
}

export function PetProfileStatus({ completeness }: Props) {
  const t = useTranslations('profile.pets.status');
  const { basicInfo, health, gallery, percent, ready } = completeness;

  return (
    <aside className="flex h-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('title')}</h4>

      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="-mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        {t('percentComplete', { percent })}
      </div>

      <div className="flex flex-col gap-2">
        <SectionPill label={t('sections.basicInfo')} state={basicInfo} />
        <SectionPill label={t('sections.health')} state={health} />
        <SectionPill label={t('sections.gallery')} state={gallery} />
      </div>

      <div
        className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
          ready
            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
            : 'border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400'
        }`}
      >
        <HeartIcon className="h-3.5 w-3.5" />
        <span>{t('readyToContact')}</span>
      </div>
    </aside>
  );
}
