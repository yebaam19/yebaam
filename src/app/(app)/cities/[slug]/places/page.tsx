import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getCityBySlug } from '@/features/cities/server/city.server'
import { getApprovedPlaces } from '@/features/cities/server/places.server'
import { PlacesGrid } from '@/features/cities/components/places/PlacesGrid'

interface Props {
  params: Promise<{ slug: string }>
}

export const metadata = { title: 'Sitios de Interés' }

export default async function CityPlacesPage({ params }: Props) {
  const { slug } = await params
  const city = await getCityBySlug(slug)
  if (!city) notFound()

  const [t, places] = await Promise.all([
    getTranslations('cities.places'),
    getApprovedPlaces(city.id, { limit: 60 }),
  ])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-100">
          {t('title')}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('subtitle', { city: city.name })}
        </p>
      </header>
      <PlacesGrid places={places} citySlug={slug} />
    </div>
  )
}
