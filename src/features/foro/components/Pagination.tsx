import Link from 'next/link'
import type { Route } from 'next'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'

interface Props {
  page: number
  pageSize: number
  total: number
  buildHref: (page: number) => string
}

const cell =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors'

export default function ForoPagination({ page, pageSize, total, buildHref }: Props) {
  const t = useTranslations('foro.pagination')
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)
  for (let p = page - 2; p <= page + 2; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p)
  }
  const sorted = Array.from(pages).sort((a, b) => a - b)

  const items: (number | 'gap')[] = []
  for (let i = 0; i < sorted.length; i++) {
    items.push(sorted[i])
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) items.push('gap')
  }

  const pageLink = (p: number, label: string, active = false, ariaLabel?: string) => (
    <Link
      key={label}
      href={buildHref(p) as Route}
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        cell,
        active
          ? 'bg-primary-600 text-white shadow-sm'
          : 'border border-neutral-200 text-neutral-700 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-300',
      )}
    >
      {label}
    </Link>
  )

  return (
    <nav
      className="flex flex-wrap items-center gap-1.5 text-xs"
      aria-label={t('ariaLabel')}
    >
      <span className="mr-1 text-neutral-500 dark:text-neutral-400">
        Página <strong>{page}</strong> de <strong>{totalPages}</strong>
      </span>
      {page > 1 && pageLink(page - 1, '‹', false, t('prevAria'))}
      {items.map((it, i) =>
        it === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-neutral-400">
            …
          </span>
        ) : (
          pageLink(it, String(it), it === page)
        ),
      )}
      {page < totalPages && pageLink(page + 1, '›', false, t('nextAria'))}
    </nav>
  )
}
