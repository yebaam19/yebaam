import Link from 'next/link'
import type { Route } from 'next'

interface Props {
  page: number
  pageSize: number
  total: number
  buildHref: (page: number) => string
}

export default function ForoPagination({ page, pageSize, total, buildHref }: Props) {
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
      className={
        active
          ? 'inline-flex h-7 min-w-7 items-center justify-center rounded bg-blue-600 px-2 text-xs font-semibold text-white'
          : 'inline-flex h-7 min-w-7 items-center justify-center rounded border border-neutral-300 px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
      }
    >
      {label}
    </Link>
  )

  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs" aria-label="Paginación">
      <span className="mr-2 text-neutral-500 dark:text-neutral-400">
        Página <strong>{page}</strong> de <strong>{totalPages}</strong>
      </span>
      {page > 1 && pageLink(page - 1, 'Anterior', false, 'Página anterior')}
      {items.map((it, i) =>
        it === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-neutral-400">
            …
          </span>
        ) : (
          pageLink(it, String(it), it === page)
        ),
      )}
      {page < totalPages && pageLink(page + 1, 'Siguiente', false, 'Página siguiente')}
    </nav>
  )
}
