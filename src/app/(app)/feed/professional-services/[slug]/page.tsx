import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import {
  AboutService,
  professionalServiceService,
  ServiceActions,
  ServiceBreadcrumb,
  ServiceCV,
  ServiceHeaderWrapper,
  ServiceMediaGallery,
  ServiceOwnerCard,
  ServicePortfolio,
  ServiceReviews,
} from '@/features/professional-services'

interface ProfessionalServicePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProfessionalServicePageProps): Promise<Metadata> {
  const { slug } = await params
  let response = await professionalServiceService.getServiceBySlug(slug)

  if (!response) {
    response = await professionalServiceService.getServiceById(slug)
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
  let response = await professionalServiceService.getServiceBySlug(slug)

  if (!response) {
    response = await professionalServiceService.getServiceById(slug)
  }

  if (!response) {
    notFound()
  }

  const { service } = response

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      {/* Breadcrumb & Actions */}
      <div className="flex items-start justify-between gap-4">
        <ServiceBreadcrumb cityName={service.city.name} citySlug={service.city.slug} serviceName={service.name} />
        <ServiceActions serviceId={service.id} serviceName={service.name} />
      </div>

      {/* Header del servicio */}
      <ServiceHeaderWrapper service={service} />

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Acerca de */}
          <AboutService service={service} />

          {/* Galería de media */}
          <ServiceMediaGallery media={service.media} serviceName={service.name} />

          {/* CV (Feature flag: SERVICES_CV_UPLOAD) */}
          <ServiceCV cvUrl={service.cvUrl} serviceName={service.name} />

          {/* Portafolio de Proyectos (Feature flag: SERVICES_PROJECTS_PORTFOLIO) */}
          <ServicePortfolio projects={service.portfolioProjects} serviceName={service.name} />

          {/* Reseñas */}
          <ServiceReviews
            reviews={service.reviews}
            averageRating={service.averageRating}
            totalReviews={service._count.reviews}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tarjeta del profesional */}
          <ServiceOwnerCard owner={service.user} />

          {/* Quick Contact - Sticky */}
          <div className="sticky top-24 rounded-2xl bg-primary-50 p-6 dark:bg-primary-900/20">
            <h3 className="mb-4 font-semibold text-neutral-900 dark:text-neutral-100">¿Interesado en este servicio?</h3>

            <div className="space-y-3">
              {service.email && (
                <a
                  href={`mailto:${service.email}?subject=Consulta sobre ${service.name}`}
                  className="block w-full rounded-lg bg-primary-500 py-3 text-center font-semibold text-white transition-colors hover:bg-primary-600"
                >
                  Enviar correo
                </a>
              )}

              {service.phone && (
                <a
                  href={`tel:${service.phone}`}
                  className="block w-full rounded-lg border border-primary-500 py-3 text-center font-semibold text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30"
                >
                  Llamar ahora
                </a>
              )}

              {service.website && (
                <a
                  href={service.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg border border-neutral-300 py-3 text-center font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Visitar sitio web
                </a>
              )}
            </div>

            {service.hourlyRate && (
              <p className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
                Desde{' '}
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: service.currency,
                    minimumFractionDigits: 0,
                  }).format(service.hourlyRate)}
                </span>{' '}
                /hora
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
