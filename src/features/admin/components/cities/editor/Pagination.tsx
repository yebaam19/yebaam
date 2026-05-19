import Link from 'next/link'
import type { Route } from 'next'

interface Props {
  baseHref: string
  page: number
  totalPages: number
  previousLabel: string
  nextLabel: string
  pageOfLabel: string
}

/**
 * Tiny prev/next pagination used by every moderation tab. Each tab keeps its
 * filter querystring in `baseHref`; this component appends `&page=N`.
 */
export function Pagination({
  baseHref,
  page,
  totalPages,
  previousLabel,
  nextLabel,
  pageOfLabel,
}: Props) {
  const buildHref = (n: number): Route => {
    const sep = baseHref.includes('?') ? '&' : '?'
    return (n > 1 ? `${baseHref}${sep}page=${n}` : baseHref) as Route
  }
  return (
    <nav
      aria-label="pagination"
      className="flex items-center justify-between pt-2 text-xs text-neutral-500"
    >
      <span>{pageOfLabel}</span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={buildHref(page - 1)}
            className="rounded-md border border-neutral-300 px-3 py-1 font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {previousLabel}
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={buildHref(page + 1)}
            className="rounded-md border border-neutral-300 px-3 py-1 font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {nextLabel}
          </Link>
        )}
      </div>
    </nav>
  )
}
