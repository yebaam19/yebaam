import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getCityBySlug } from '@/features/cities/server/city.server'
import { getCityPublications } from '@/features/cities/server/publications.server'
import { PublicationsFeed } from '@/features/cities/components/publications/PublicationsFeed'

interface Props {
  params: Promise<{ slug: string }>
}

export const metadata = { title: 'Publicaciones' }

export default async function CityPublicationsPage({ params }: Props) {
  const { slug } = await params
  const city = await getCityBySlug(slug)
  if (!city) notFound()
  const [t, publications] = await Promise.all([
    getTranslations('cities.publications'),
    getCityPublications(city.id, { limit: 50 }),
  ])
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-100">
          {t('title')}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('subtitle', { city: city.name })}
        </p>
      </header>
      <PublicationsFeed publications={publications} />
    </div>
  )
}
