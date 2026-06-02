import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ProfessionalServicesListingContainer, SERVICE_CATEGORIES } from '@/features/professional-services'
import { getAllCities, getStates, listServices } from '@/features/professional-services/server/services.server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('professional')
  return {
    title: t('servicesMetadata.title'),
    description: t('servicesMetadata.description'),
    keywords: [
      'servicios profesionales',
      'directorio profesionales',
      'abogados',
      'contadores',
      'médicos',
      'arquitectos',
      'desarrolladores',
      'Colombia',
    ],
    openGraph: {
      title: t('servicesMetadata.ogTitle'),
      description: t('servicesMetadata.ogDescription'),
      type: 'website',
    },
  }
}

export const dynamic = 'force-dynamic'

interface ProfessionalServicesPageProps {
  searchParams: Promise<{ city?: string; q?: string }>
}

export default async function ProfessionalServicesPage({ searchParams }: ProfessionalServicesPageProps) {
  const { city: citySlug, q: initialQuery } = await searchParams

  // Carga inicial en el servidor desde Supabase. El contenedor refina en el
  // cliente; estos props alimentan los filtros y el primer render. Las
  // categorías son la taxonomía estática del PDF (no hay tabla para ellas).
  const [states, cities, initial] = await Promise.all([
    getStates(),
    getAllCities(),
    listServices({ page: 1, limit: 24 }),
  ])
  const categories = SERVICE_CATEGORIES

  // El portal de ciudad enlaza con `?city=<slug>`; lo traducimos a cityId para
  // pre-filtrar la lista (la store de filtros trabaja con ids).
  const initialCityId = citySlug ? cities.find((c) => c.slug === citySlug)?.id : undefined

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfessionalServicesListingContainer
        initialServices={initial.services}
        initialTotal={initial.total}
        states={states}
        cities={cities}
        categories={categories}
        initialCityId={initialCityId}
        initialQuery={initialQuery}
      />
    </div>
  )
}
