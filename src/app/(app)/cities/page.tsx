import { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'

// Import directly, not via the @/features/cities barrel — avoids dragging
// every export into the page's bundle (bundle-barrel-imports).
import { CitiesGrid } from '@/features/cities/components/CitiesGrid'
import { CitiesHero } from '@/features/cities/components/CitiesHero'
import { CitiesToolbar } from '@/features/cities/components/CitiesToolbar'
import {
  getCities,
  getCountriesWithCities,
  getGlobalStats,
} from '@/features/cities/server/cities.server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cities')
  return {
    title: t('metadata.listTitle'),
    description: t('metadata.listDescription'),
    openGraph: {
      title: t('metadata.ogTitle'),
      description: t('metadata.ogDescription'),
      type: 'website',
    },
  }
}

interface PageProps {
  searchParams: Promise<{ q?: string; country?: string }>
}

/**
 * Cities Portal landing page (`/cities`).
 *
 * Pure RSC. The hero stats and country options are awaited eagerly so the
 * shell renders SSR-complete (no client fetch, no "..." flash). The cities
 * grid is wrapped in a Suspense boundary whose `key` includes the active
 * filters — so the skeleton appears between filter applies without blocking
 * the rest of the shell.
 */
export default async function CitiesPage({ searchParams }: PageProps) {
  const { q, country } = await searchParams
  const [stats, countries] = await Promise.all([
    getGlobalStats(),
    getCountriesWithCities(),
  ])

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <CitiesHero stats={stats} />
      <CitiesToolbar countries={countries} />
      <Suspense fallback={<CitiesGridSkeleton />} key={`${q ?? ''}::${country ?? ''}`}>
        <CitiesGridAsync q={q} countryCode={country} />
      </Suspense>
    </div>
  )
}

async function CitiesGridAsync({ q, countryCode }: { q?: string; countryCode?: string }) {
  const cities = await getCities({ q, countryCode })
  return <CitiesGrid cities={cities} />
}

/**
 * Skeleton for the cities grid; rendered while the filtered query resolves.
 */
function CitiesGridSkeleton() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
