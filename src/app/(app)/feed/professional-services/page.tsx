import type { Metadata } from 'next'

import {
  MOCK_CITIES,
  MOCK_STATES,
  professionalServiceService,
  ProfessionalServicesListingContainer,
  SERVICE_CATEGORIES,
} from '@/features/professional-services'

export const metadata: Metadata = {
  title: 'Servicios Profesionales | Encuentra Expertos Cerca de Ti',
  description:
    'Explora nuestro directorio de servicios profesionales. Encuentra abogados, contadores, médicos, desarrolladores y más profesionales verificados en tu ciudad.',
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
    title: 'Servicios Profesionales',
    description: 'Encuentra profesionales verificados para todas tus necesidades',
    type: 'website',
  },
}

export default async function ProfessionalServicesPage() {
  const [servicesResponse] = await Promise.all([professionalServiceService.getServices({ page: 1, limit: 12 })])

  return (
    <div className="container mx-auto max-w-7xl p-5">
      <ProfessionalServicesListingContainer
        initialServices={servicesResponse.services}
        initialTotal={servicesResponse.total}
        states={MOCK_STATES}
        cities={MOCK_CITIES}
        categories={SERVICE_CATEGORIES}
      />
    </div>
  )
}
