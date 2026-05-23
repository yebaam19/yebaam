import Link from 'next/link'
import type { Route } from 'next'
import { listPublicBadgeCatalog } from '@/features/badges/server/catalog.server'
import { CatalogGrid } from '@/features/badges/components/CatalogGrid'

// The catalog read calls getServerClient() which uses cookies(); force-dynamic
// prevents Turbopack from attempting static path generation.
export const dynamic = 'force-dynamic'


export const metadata = {
  title: 'Reconocimientos',
  description: 'Insignias y badges que se otorgan en Yebaam — requisitos y cómo solicitarlas.',
}

interface PageProps {
  searchParams: Promise<{ slot?: string; category?: string }>
}

export default async function InsigniasCatalogPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const slot = sp.slot === 'insignia' || sp.slot === 'badge' ? sp.slot : undefined
  const category = sp.category?.trim() || undefined
  const all = await listPublicBadgeCatalog({ slot, category })

  const insignias = all.filter((b) => b.slot === 'insignia')
  const badges = all.filter((b) => b.slot === 'badge')

  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Reconocimientos</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          Las <strong>insignias</strong> aparecen junto al nombre del usuario y representan el nivel máximo de un
          reconocimiento (verificación, nivel de estudio, logros deportivos, etc.). Los <strong>badges</strong>{' '}
          aparecen en la franja debajo de la foto de portada y reconocen logros específicos.
        </p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-1 text-xs">
        <FilterChip href="/insignias" active={!slot && !category} label="Todos" />
        <FilterChip href="/insignias?slot=insignia" active={slot === 'insignia' && !category} label="Insignias" />
        <FilterChip href="/insignias?slot=badge" active={slot === 'badge' && !category} label="Badges" />
        <span className="mx-2 text-neutral-300">·</span>
        {[
          { v: 'verification', l: 'Verificación' },
          { v: 'study', l: 'Estudio' },
          { v: 'sports', l: 'Deportes' },
          { v: 'recognition', l: 'Reconocimientos' },
          { v: 'pioneer', l: 'Pionero' },
        ].map((c) => (
          <FilterChip
            key={c.v}
            href={`/insignias?category=${c.v}`}
            active={category === c.v}
            label={c.l}
          />
        ))}
      </nav>

      {(!slot || slot === 'insignia') && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">Insignias ({insignias.length})</h2>
          <CatalogGrid items={insignias} />
        </section>
      )}

      {(!slot || slot === 'badge') && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Badges ({badges.length})</h2>
          <CatalogGrid items={badges} />
        </section>
      )}
    </div>
  )
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href as Route}
      className={`rounded-full px-3 py-1 ${
        active
          ? 'bg-primary-600 text-white'
          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
      }`}
    >
      {label}
    </Link>
  )
}
