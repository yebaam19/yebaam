import { GlobeAmericasIcon, SparklesIcon, UserGroupIcon } from '@/components/icons/heroicons-shim'
import { getTranslations } from 'next-intl/server'
import type { GlobalStats } from '../interfaces/global-stats.interface'

interface CitiesHeroProps {
  stats: GlobalStats
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K+`
  }
  return `${num}+`
}

/**
 * Hero section for the Cities Portal. Pure RSC — the stats are SSR'd from
 * the parent page so there is no client-side fetch and no "..." loading flash.
 */
export async function CitiesHero({ stats }: CitiesHeroProps) {
  const t = await getTranslations('cities')

  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-linear-to-br from-primary-600 via-primary-700 to-emerald-800 px-6 py-16 text-white shadow-xl sm:px-12 lg:px-16">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <svg
          className="absolute top-0 left-[max(50%,25rem)] h-256 w-512 -translate-x-1/2 mask-[radial-gradient(64rem_64rem_at_top,white,transparent)] stroke-white/10"
          aria-hidden="true"
        >
          <defs>
            <pattern id="hero-pattern" width={200} height={200} x="50%" y={-1} patternUnits="userSpaceOnUse">
              <path d="M100 200V.5M.5 .5H200" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" strokeWidth={0} fill="url(#hero-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
          <GlobeAmericasIcon className="h-5 w-5" />
          <span>{t('hero.badge')}</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{t('hero.title')}</h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90 sm:text-xl">{t('hero.subtitle')}</p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2">
              <GlobeAmericasIcon className="h-6 w-6 text-amber-300" />
              <span className="text-3xl font-bold">{formatNumber(stats.totalCities)}</span>
            </div>
            <p className="mt-1 text-sm text-white/80">{t('hero.stats.cities')}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2">
              <UserGroupIcon className="h-6 w-6 text-amber-300" />
              <span className="text-3xl font-bold">{formatNumber(stats.totalUsers)}</span>
            </div>
            <p className="mt-1 text-sm text-white/80">{t('hero.stats.users')}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2">
              <SparklesIcon className="h-6 w-6 text-amber-300" />
              <span className="text-3xl font-bold">{formatNumber(stats.totalMedia)}</span>
            </div>
            <p className="mt-1 text-sm text-white/80">{t('hero.stats.media')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
