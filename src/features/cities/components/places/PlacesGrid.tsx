import { getTranslations } from 'next-intl/server'
import type { CityPlaceDetail } from '@/features/cities/server/places.server'
import { PlaceCard } from './PlaceCard'

interface Props {
  places: CityPlaceDetail[]
  citySlug: string
}

export async function PlacesGrid({ places, citySlug }: Props) {
  const t = await getTranslations('cities.places')
  if (places.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('empty')}</p>
      </section>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {places.map((p) => (
        <PlaceCard key={p.id} place={p} citySlug={citySlug} />
      ))}
    </div>
  )
}
