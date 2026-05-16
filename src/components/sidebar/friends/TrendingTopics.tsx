'use client'

import Link from 'next/link'
import { ArrowRightIcon, FireIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'

// TODO: wire to trending hashtags endpoint when available — placeholder data mirrors mockup
const TRENDING = [
  { tag: 'SalsaCali', posts: '1.2k publicaciones' },
  { tag: 'ViajerosYebaam', posts: '856 publicaciones' },
  { tag: 'Emprendedores', posts: '642 publicaciones' },
]

export function TrendingTopics() {
  const t = useTranslations('nav')
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
        {t('trending')}
      </h3>

      <ul className="space-y-3">
        {TRENDING.map((trend) => (
          <li key={trend.tag}>
            <Link
              href={`/search?q=%23${trend.tag}`}
              className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500 dark:bg-orange-500/10">
                <FireIcon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                  #{trend.tag}
                </p>
                <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                  {trend.posts}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/search?tab=hashtags"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        {t('viewMoreTrends')}
        <ArrowRightIcon className="size-3.5" />
      </Link>
    </section>
  )
}
