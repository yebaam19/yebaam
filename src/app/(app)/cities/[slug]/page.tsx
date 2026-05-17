import { CityHeader, cityService, CityTabs, MediaType } from '@/features/cities'
import { unslugify } from '@/lib/utils'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: Promise<{ slug: string }>
}

/**
 * Genera metadata dinámica para SEO
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cityName = unslugify(slug)
  const t = await getTranslations('cities')

  return {
    title: t('metadata.detailTitle', { city: cityName }),
    description: t('metadata.detailDescription', { city: cityName }),
    openGraph: {
      title: t('metadata.detailOgTitle', { city: cityName }),
      description: t('metadata.detailOgDescription', { city: cityName }),
      type: 'website',
    },
  }
}

/**
 * Página de detalle de ciudad
 * Server Component - Fetching de datos en el servidor
 */
export default async function CityDetailPage({ params }: Props) {
  const { slug } = await params

  // Fetch en el servidor
  const city = await cityService.getCityBySlug(slug)

  if (!city || !(city as any).id || !city.stats) {
    notFound()
  }

  // Filtrar media por tipo
  const photos = (city.cityMedia ?? []).filter((m) => m.type === MediaType.IMAGE)
  const videos = (city.cityMedia ?? []).filter((m) => m.type === MediaType.VIDEO)

  return (
    <div className="space-y-6">
      {/* Header - Server Component con estadísticas reales */}
      <CityHeader
        cityName={city.name}
        stateName={city.state?.name}
        countryName={city.country.name}
        coverImage={city.coverImageUrl}
        stats={{
          photosCount: city.stats.photosCount,
          videosCount: city.stats.videosCount,
          followersCount: city.stats.followersCount,
        }}
      />

      {/* Tabs - Client Component para interactividad */}
      <Suspense fallback={<CityTabsSkeleton />}>
        <CityTabs cityName={city.name} citySlug={slug} photos={photos} videos={videos} />
      </Suspense>
    </div>
  )
}

/**
 * Skeleton para los tabs
 */
function CityTabsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="rounded-xl bg-white p-1.5 shadow-sm dark:bg-neutral-800">
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-24 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-neutral-200 dark:bg-neutral-700" />
        ))}
      </div>
    </div>
  )
}
