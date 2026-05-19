import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getCityBySlug } from '@/features/cities/server/city.server'
import { getActivePromotions } from '@/features/cities/server/promotions.server'
import { PromotionsList } from '@/features/cities/components/promotions/PromotionsList'

interface Props {
  params: Promise<{ slug: string }>
}

export const metadata = { title: 'Promociones' }

export default async function CityPromotionsPage({ params }: Props) {
  const { slug } = await params
  const city = await getCityBySlug(slug)
  if (!city) notFound()
  const [t, promotions] = await Promise.all([
    getTranslations('cities.promotions'),
    getActivePromotions(city.id),
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
      <PromotionsList promotions={promotions} />
    </div>
  )
}
