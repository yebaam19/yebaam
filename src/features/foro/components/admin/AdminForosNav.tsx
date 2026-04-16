'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'
import clsx from 'clsx'

const TABS: { href: Route; label: string }[] = [
  { href: '/admin/foros' as Route, label: 'Espacios y staff' },
  { href: '/admin/foros/temas' as Route, label: 'Moderar temas' },
]

export default function AdminForosNav() {
  const pathname = usePathname() ?? ''
  return (
    <nav
      aria-label="Secciones del admin de foros"
      className="mb-6 flex flex-wrap items-center gap-1 border-b border-neutral-200 dark:border-neutral-800"
    >
      {TABS.map((t) => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              '-mb-px inline-flex items-center border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-primary-600 text-primary-700 dark:text-primary-400'
                : 'border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
