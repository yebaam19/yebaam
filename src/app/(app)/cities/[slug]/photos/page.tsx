import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getCityBySlug } from '@/features/cities/server/city.server'
import { getCityPhotos } from '@/features/cities/server/photos.server'
import { PhotosGrid } from '@/features/cities/components/photos/PhotosGrid'

interface Props {
  params: Promise<{ slug: string }>
}

export const metadata = { title: 'Fotos' }

export default async function CityPhotosPage({ params }: Props) {
  const { slug } = await params
  const city = await getCityBySlug(slug)
  if (!city) notFound()
  const [t, photos] = await Promise.all([
    getTranslations('cities.photos'),
    getCityPhotos(city.id, { limit: 60 }),
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
      <PhotosGrid photos={photos} />
    </div>
  )
}
