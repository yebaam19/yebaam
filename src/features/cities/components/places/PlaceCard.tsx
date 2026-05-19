import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { MapPinIcon } from '@/components/icons/heroicons-shim'
import type { CityPlaceDetail } from '@/features/cities/server/places.server'

interface Props {
  place: CityPlaceDetail
  citySlug: string
}

export function PlaceCard({ place, citySlug }: Props) {
  return (
    <Link
      href={`/cities/${citySlug}/places/${place.id}` as Route}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-200 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:ring-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:bg-neutral-800 dark:ring-white/5"
    >
      {place.imageUrl ? (
        <Image
          src={place.imageUrl}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-600 to-primary-800" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 space-y-1 p-3 sm:p-4">
        <h3 className="text-sm font-bold leading-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] sm:text-base">
          {place.name}
        </h3>
        {place.address && (
          <p className="flex items-center gap-1 text-[11px] text-white/85">
            <MapPinIcon className="h-3 w-3" />
            <span className="truncate">{place.address}</span>
          </p>
        )}
      </div>
      {place.category && (
        <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-800 backdrop-blur-sm">
          {place.category}
        </span>
      )}
    </Link>
  )
}
