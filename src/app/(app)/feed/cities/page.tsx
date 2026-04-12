import { CitiesGrid, CitiesHero, cityService } from '@/features/cities'
import { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Portal de Ciudades | Conecta con tu comunidad',
  description:
    'Explora y conoce ciudades destacadas por su cultura, historia y conexión. Conecta con tu comunidad local.',
  openGraph: {
    title: 'Portal de Ciudades',
    description: 'Explora y conoce ciudades destacadas por su cultura, historia y conexión.',
    type: 'website',
  },
}

/**
 * Página principal del Portal de Ciudades
 * Server Component - Fetching de datos en el servidor
 */
export default async function CitiesPage() {
  // Fetch en el servidor
  const { cities } = await cityService.getAllCities()

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      {/* Hero Section - Server Component */}
      <CitiesHero />

      {/* Cities Grid - Server Component con datos pre-fetched */}
      <Suspense fallback={<CitiesGridSkeleton />}>
        <CitiesGrid cities={cities} />
      </Suspense>
    </div>
  )
}

/**
 * Skeleton loader para el grid de ciudades
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
