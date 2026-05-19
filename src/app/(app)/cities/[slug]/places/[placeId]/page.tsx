import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeftIcon, MapPinIcon } from '@/components/icons/heroicons-shim'
import { getCityBySlug } from '@/features/cities/server/city.server'
import { getPlaceById } from '@/features/cities/server/places.server'

interface Props {
  params: Promise<{ slug: string; placeId: string }>
}

export const metadata = { title: 'Sitio de Interés' }

export default async function CityPlaceDetailPage({ params }: Props) {
  const { slug, placeId } = await params
  const [city, place, t] = await Promise.all([
    getCityBySlug(slug),
    getPlaceById(placeId),
    getTranslations('cities.places'),
  ])
  if (!city || !place || place.cityId !== city.id) notFound()

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/cities/${slug}/places` as Route}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {t('backToList')}
      </Link>

      {place.imageUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-800">
          <Image
            src={place.imageUrl}
            alt={place.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{place.name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
          {place.category && (
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {place.category}
            </span>
          )}
          {place.address && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="h-4 w-4" />
              {place.address}
            </span>
          )}
        </div>
      </header>

      {place.description && (
        <div className="prose max-w-none text-neutral-800 dark:prose-invert dark:text-neutral-200">
          <p className="whitespace-pre-wrap text-base leading-relaxed">{place.description}</p>
        </div>
      )}

      {place.latitude != null && place.longitude != null && (
        <a
          href={`https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=16/${place.latitude}/${place.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <MapPinIcon className="h-4 w-4" />
          {t('openInMap')}
        </a>
      )}
    </article>
  )
}
