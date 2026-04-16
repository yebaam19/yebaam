import Link from 'next/link'
import type { Route } from 'next'
import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim'

interface Props {
  title: string
  subtitle?: string
  crumbs?: { href: string; label: string }[]
  action?: React.ReactNode
}

// Branded page header for any foro surface: Yebaam-green accent mark on the
// left, breadcrumb + title + subtitle in the middle, optional action slot on
// the right. Consistent across /foro, space board, forum, and thread pages.
export default function ForoHeader({ title, subtitle, crumbs, action }: Props) {
  return (
    <header className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-primary-50 via-white to-white p-4 shadow-sm sm:p-6 dark:border-neutral-800 dark:from-primary-900/20 dark:via-neutral-900 dark:to-neutral-900">
      {crumbs && crumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="mb-2 flex flex-wrap items-center gap-x-1.5 text-xs text-neutral-500 dark:text-neutral-400"
        >
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-x-1.5">
              <Link href={c.href as Route} className="truncate hover:text-primary-700 dark:hover:text-primary-400">
                {c.label}
              </Link>
              {i < crumbs.length - 1 && <span aria-hidden>›</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap sm:gap-5">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm sm:h-12 sm:w-12"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-neutral-900 sm:text-2xl dark:text-neutral-50">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="order-last w-full shrink-0 sm:order-none sm:w-auto">{action}</div>
        )}
      </div>
    </header>
  )
}
