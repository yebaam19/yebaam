import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ProfessionalServicesListingContainer, professionalServiceService } from '@/features/professional-services'

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
  searchParams: Promise<{ city?: string }>
}

export default async function ProfessionalServicesPage({ searchParams }: ProfessionalServicesPageProps) {
  const { city: citySlug } = await searchParams

  // Carga inicial en el servidor (datos mock en dev). El contenedor refina con
  // React Query en el cliente; estos props alimentan los filtros y el primer render.
  const [states, cities, categories, initial] = await Promise.all([
    professionalServiceService.getStates(),
    professionalServiceService.getAllCities(),
    professionalServiceService.getCategories(),
    professionalServiceService.getServices({ page: 1, limit: 24 }),
  ])

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
      />
    </div>
  )
}
