import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getCityBySlug } from '@/features/cities/server/city.server'
import { getCityVideos } from '@/features/cities/server/videos.server'
import { VideosGrid } from '@/features/cities/components/videos/VideosGrid'

interface Props {
  params: Promise<{ slug: string }>
}

export const metadata = { title: 'Videos' }

export default async function CityVideosPage({ params }: Props) {
  const { slug } = await params
  const city = await getCityBySlug(slug)
  if (!city) notFound()
  const [t, videos] = await Promise.all([
    getTranslations('cities.videos'),
    getCityVideos(city.id, { limit: 50 }),
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
      <VideosGrid videos={videos} />
    </div>
  )
}
