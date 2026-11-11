import { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'

// Import directly, not via the @/features/cities barrel — avoids dragging
// every export into the page's bundle (bundle-barrel-imports).
import { CitiesGrid } from '@/features/cities/components/CitiesGrid'
import { CitiesHero } from '@/features/cities/components/CitiesHero'
import { CitiesToolbar } from '@/features/cities/components/CitiesToolbar'
import {
  getCitiesPage,
  type CitiesPage as CitiesPageResult,
  getFeaturedHeroCity,
} from '@/features/cities/server/cities.server'
import { getCountries, getStates } from '@/features/cities/server/discovery-options.server'

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
  searchParams: Promise<{ q?: string; country?: string; state?: string; page?: string }>
}

/**
 * Cities Portal landing page (`/cities`).
 *
 * Pure RSC. The hero background image and the country options are awaited
 * eagerly so the shell renders SSR-complete (no client fetch, no "..." flash).
 * The cities grid is wrapped in a Suspense boundary whose `key` includes the
 * active filters — so the skeleton appears between filter applies without
 * blocking the rest of the shell.
 */
export default async function CitiesPage({ searchParams }: PageProps) {
  const { q, country, state, page } = await searchParams
  const result = getCitiesPage({ q, countryCode: country, stateId: state, page: Number(page ?? 1) })
  const [heroCity, countries, states] = await Promise.all([
    getFeaturedHeroCity(),
    getCountries(),
    getStates(country?.trim().toUpperCase() ?? ''),
  ])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <CitiesHero
        backgroundImageUrl={heroCity?.coverImageUrl}
        backgroundImageAlt={heroCity?.name}
      />
      <CitiesToolbar countries={countries} states={states} />
      <Suspense fallback={<CitiesGridSkeleton />} key={`${q ?? ''}::${country ?? ''}::${state ?? ''}::${page ?? 1}`}>
        <CitiesGridAsync result={result} />
      </Suspense>
    </div>
  )
}

async function CitiesGridAsync({ result }: { result: Promise<CitiesPageResult> }) {
  return <CitiesGrid {...await result} />
}

/**
 * Skeleton for the cities grid; rendered while the filtered query resolves.
 * Mirrors the 4-col image-card grid shape so the loading state doesn't jump.
 */
function CitiesGridSkeleton() {
  return (
    <section>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/3] animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800"
          />
        ))}
      </div>
    </section>
  )
}
