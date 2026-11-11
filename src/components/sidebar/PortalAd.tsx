'use client'

/** Music Archive entry in the shared right rail, using the app's theme palette. */

import { ArrowRightIcon, MusicalNoteIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Route } from 'next'
import { primaryActionStyles } from '@/ui/primary-action-styles'

export function PortalAd() {
  const t = useTranslations('nav')
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
      <div className="mb-3 flex items-center gap-2">
        <MusicalNoteIcon className="size-5 shrink-0 text-amber-700 dark:text-amber-400" />
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t('musicArchive')}</h3>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
        {t('musicArchiveDescription')}
      </p>

      <Link
        href={'/musica' as Route}
        className={`${primaryActionStyles} flex items-center justify-between gap-3 px-3 py-2 text-xs`}
      >
        <span>{t('exploreArchive')}</span>
        <ArrowRightIcon className="size-4" />
      </Link>
    </div>
  )
}
