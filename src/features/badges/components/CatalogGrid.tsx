import Link from 'next/link'
import type { Route } from 'next'
import type { CatalogBadge } from '@/features/badges/types/badges.types'
import { BadgeArt } from '@/features/badges/components/BadgeArt'

const CATEGORY_LABEL: Record<string, string> = {
  verification: 'Verificación',
  study: 'Estudio',
  sports: 'Deportes',
  recognition: 'Reconocimientos',
  pioneer: 'Pionero',
  authentication: 'Autenticación',
  other: 'Otra',
}

const TIER_LABEL: Record<string, string> = {
  world: 'Mundial',
  mundial: 'Mundial',
  regional: 'Regional',
  national: 'Nacional',
  nacional: 'Nacional',
  local: 'Local',
  phd: 'Doctorado',
  doctorado: 'Doctorado',
  msc: 'Maestría',
  maestria: 'Maestría',
  bsc: 'Licenciatura',
  licenciatura: 'Licenciatura',
}

function formatTier(tier: string | null): string | null {
  if (!tier) return null
  return TIER_LABEL[tier.toLowerCase().trim()] ?? tier
}

export function CatalogGrid({ items }: { items: CatalogBadge[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
        Aún no hay reconocimientos en esta categoría.
      </p>
    )
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((b) => (
        <li key={b.id}>
          <Link
            href={`/insignias/${b.slug}` as Route}
            className="group block h-full rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
          >
            <div className="flex items-start gap-3">
              <BadgeArt
                size="catalog"
                category={b.category}
                tier={b.tier}
                slug={b.slug}
                iconUrl={b.iconUrl}
                alt={b.name}
                className="transition-transform duration-200 group-hover:rotate-[-4deg]"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {b.name}
                </h3>
                <p className="text-[11px] text-neutral-500">
                  {CATEGORY_LABEL[b.category] ?? b.category}
                  {formatTier(b.tier) ? ` · ${formatTier(b.tier)}` : ''}
                </p>
              </div>
            </div>
            {b.description && (
              <p className="mt-3 line-clamp-3 text-xs text-neutral-600 dark:text-neutral-400">
                {b.description}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
              <span>{b.grantCount.toLocaleString('es-ES')} usuarios</span>
              {b.requestable && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Solicitable
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
