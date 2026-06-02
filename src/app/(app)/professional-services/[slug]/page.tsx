import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import {
  ProfileLayoutWrapper,
  ServiceActions,
  ServiceBreadcrumb,
} from '@/features/professional-services'
import { getServiceById, getServiceBySlug } from '@/features/professional-services/server/services.server'

interface ProfessionalServicePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProfessionalServicePageProps): Promise<Metadata> {
  const { slug } = await params
  let response = await getServiceBySlug(slug)

  if (!response) {
    response = await getServiceById(slug)
  }

  if (!response) {
    return {
      title: 'Servicio no encontrado',
    }
  }

  const { service } = response
  const categoryName = service.category?.name || 'Servicios Profesionales'

  return {
    title: `${service.name} | ${categoryName} en ${service.city.name}`,
    description:
      service.description?.slice(0, 160) ||
      `${service.name} - Servicio profesional de ${categoryName} en ${service.city.name}`,
    openGraph: {
      title: service.name,
      description: service.description?.slice(0, 160) || `${categoryName} en ${service.city.name}`,
      images: service.coverUrl ? [service.coverUrl] : service.logoUrl ? [service.logoUrl] : [],
    },
  }
}

export default async function ProfessionalServicePage({ params }: ProfessionalServicePageProps) {
  const { slug } = await params

  // Intentar buscar por slug primero, luego por ID
  let response = await getServiceBySlug(slug)

  if (!response) {
    response = await getServiceById(slug)
  }

  if (!response) {
    notFound()
  }

  const { service } = response

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      {/* Breadcrumb & Actions */}
      <div className="flex items-start justify-between gap-4">
        <ServiceBreadcrumb cityName={service.city.name} citySlug={service.city.slug} serviceName={service.name} />
        <ServiceActions serviceId={service.id} serviceName={service.name} />
      </div>

      {/* Perfil de servicio — distribución de 3 columnas (mockup pág. 9) */}
      <ProfileLayoutWrapper service={service} />
    </div>
  )
}
