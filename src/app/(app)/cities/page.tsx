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
  getFeaturedHeroCity,
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
 * Pure RSC. The hero background image and the country options are awaited
 * eagerly so the shell renders SSR-complete (no client fetch, no "..." flash).
 * The cities grid is wrapped in a Suspense boundary whose `key` includes the
 * active filters — so the skeleton appears between filter applies without
 * blocking the rest of the shell.
 */
export default async function CitiesPage({ searchParams }: PageProps) {
  const { q, country } = await searchParams
  const [heroCity, countries] = await Promise.all([
    getFeaturedHeroCity(),
    getCountriesWithCities(),
  ])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <CitiesHero
        backgroundImageUrl={heroCity?.coverImageUrl}
        backgroundImageAlt={heroCity?.name}
      />
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
 * Mirrors the 4-col image-card grid shape so the loading state doesn't jump.
 */
function CitiesGridSkeleton() {
  return (
    <section>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/3] animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800"
          />
        ))}
      </div>
    </section>
  )
}
