import { MapPinIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

interface CityHeaderProps {
  cityName: string
  stateName?: string
  countryName: string
  coverImage?: string
  stats?: {
    photoCount: number
    videoCount: number
    followerCount: number
  }
}

/**
 * Header de ciudad con imagen de fondo
 */
export async function CityHeader({
  cityName,
  stateName,
  countryName,
  coverImage = 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg',
  stats,
}: CityHeaderProps) {
  const t = await getTranslations('cities')
  return (
    <div className="relative isolate h-[280px] overflow-hidden rounded-2xl bg-neutral-900 text-white sm:h-80">
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-0">
        <Image
          src={coverImage}
          alt={t('header.coverAlt', { city: cityName })}
          fill
          className="object-cover brightness-[0.4]"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          unoptimized
        />
      </div>

      {/* Gradiente overlay */}
      <div className="absolute inset-0 z-1 bg-linear-to-t from-black/60 via-transparent to-transparent" />

      {/* Contenido */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
              <MapPinIcon className="h-4 w-4" />
              <span>
                {stateName ? `${stateName}, ` : ''}
                {countryName}
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{cityName}</h1>
          </div>

          {/* Stats - Ahora usa datos reales */}
          {stats && (
            <div className="hidden items-center gap-6 sm:flex">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.photoCount}</p>
                <p className="text-sm text-white/70">{t('header.stats.photos')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.videoCount}</p>
                <p className="text-sm text-white/70">{t('header.stats.videos')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {stats.followerCount >= 1000
                    ? `${(stats.followerCount / 1000).toFixed(1)}K`
                    : stats.followerCount}
                </p>
                <p className="text-sm text-white/70">{t('header.stats.members')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
