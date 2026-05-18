import Image from 'next/image'
import Link from 'next/link'
import { UserGroupIcon } from '@/components/icons/heroicons-shim'
import { CityBasic } from '../interfaces/city.interfaces'

interface CityCardProps {
  city: CityBasic
  /**
   * Pre-translated label for the small "Explore" CTA in the bottom-right
   * corner. Passed in by the (client) `CitiesGrid` parent so this stays a
   * pure presentational component that can render in either RSC or client
   * trees without dragging `next-intl` in.
   */
  exploreLabel: string
}

function formatFollowers(n: number): string {
  if (n < 1000) return `${n}`
  if (n < 1_000_000) {
    const v = n / 1000
    return `${v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')}K`
  }
  const v = n / 1_000_000
  return `${v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')}M`
}

/**
 * Image-forward city card. Pure presentation, zero hooks.
 *
 * Layout matches `public/cities.png`: cover photo fills the 4:3 frame, a
 * follower-count pill sits top-right, and a dark gradient at the bottom
 * holds the city name, country, and an "Explorar" affordance. Subtle hover
 * lift + image zoom adds depth without breaking the gallery rhythm.
 */
export function CityCard({ city, exploreLabel }: CityCardProps) {
  const followers = formatFollowers(city.stats.followerCount)

  return (
    <Link
      href={`/cities/${city.slug}`}
      aria-label={`${city.name}, ${city.country.name}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-200 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:ring-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:bg-neutral-800 dark:ring-white/5"
    >
      {city.coverImageUrl ? (
        <Image
          src={city.coverImageUrl}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 via-neutral-400 to-neutral-500 dark:from-neutral-700 dark:to-neutral-900" />
      )}

      {/* Bottom-up scrim — ramps fast in the bottom third so text stays legible. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* Follower pill, anchored top-right. */}
      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10">
        <UserGroupIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <span aria-label={`${city.stats.followerCount} followers`}>{followers}</span>
      </span>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold leading-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] sm:text-lg">
            {city.name}
          </h3>
          <p className="truncate text-xs font-medium text-white/85 sm:text-[13px]">
            {city.country.name}
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-neutral-900 shadow-sm ring-1 ring-black/5 transition-all group-hover:translate-x-0.5 group-hover:bg-white sm:text-xs">
          {exploreLabel}
        </span>
      </div>
    </Link>
  )
}
