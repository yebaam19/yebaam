'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { DirectoryEntry } from '@/features/cities/directory/types'
import { cfImageUrl } from '@/lib/cloudflare'

export function DirectoryEntryCard({ entry }: { entry: DirectoryEntry }) {
  const t = useTranslations('cities.directoryEntries')
  const cover = cfImageUrl(entry.cover_cf_image_id)
  return <li className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
    {cover && <Image src={cover} alt="" width={640} height={400} unoptimized
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="aspect-[16/10] w-full object-cover" />}
    <div className="space-y-3 p-5">
      <h2 className="break-words text-lg font-semibold">{entry.name}</h2>
      {entry.description && <p className="whitespace-pre-line break-words text-sm text-neutral-600 dark:text-neutral-300">{entry.description}</p>}
      <dl className="space-y-2 text-sm">
        {entry.address && <div><dt className="text-xs text-neutral-500">{t('address')}</dt><dd className="break-words">{entry.address}</dd></div>}
        {entry.phone && <div><dt className="text-xs text-neutral-500">{t('phone')}</dt><dd>{entry.phone}</dd></div>}
      </dl>
      {entry.website && <a href={entry.website} target="_blank" rel="noopener noreferrer nofollow"
        onClick={(event) => { if (!window.confirm(t('externalWarning'))) event.preventDefault() }}
        className="inline-flex min-h-10 items-center font-medium text-primary-700 underline dark:text-primary-300">{t('website')}</a>}
    </div>
  </li>
}
