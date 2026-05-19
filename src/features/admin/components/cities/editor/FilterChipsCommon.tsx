import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'

interface ChipItem<S extends string> {
  id: S | undefined
  key: string
}

interface Props<S extends string> {
  items: ChipItem<S>[]
  basePath: string
  tab: string
  active?: S
  namespace: string
}

export async function FilterChipsCommon<S extends string>({
  items,
  basePath,
  tab,
  active,
  namespace,
}: Props<S>) {
  const t = await getTranslations(namespace)
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((c) => {
        const isActive = active === c.id
        const params = new URLSearchParams()
        params.set('tab', tab)
        if (c.id) params.set('status', c.id)
        const href = (`${basePath}?${params.toString()}`) as Route
        return (
          <Link
            key={c.id ?? '__all'}
            href={href}
            className={
              'rounded-full px-3 py-1 text-xs font-medium transition-colors ' +
              (isActive
                ? 'bg-primary-600 text-white'
                : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800')
            }
          >
            {t(c.key as Parameters<typeof t>[0])}
          </Link>
        )
      })}
    </div>
  )
}
