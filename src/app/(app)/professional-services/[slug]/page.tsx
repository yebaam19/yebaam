import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCachedAuthUser } from '@/features/auth/actions/auth.actions'
import {
  ProfileLayoutWrapper,
  ServiceActions,
  ServiceBreadcrumb,
} from '@/features/professional-services'
import { listServiceOfferings } from '@/features/professional-services/server/offerings.server'
import { getOwnerPublicPosts, getOwnerPublishedArticles } from '@/features/professional-services/server/owner-content.server'
import { listServiceQuestions } from '@/features/professional-services/server/questions.server'
import { getServiceById, getServiceBySlug } from '@/features/professional-services/server/services.server'

interface ProfessionalServicePageProps {
  params: Promise<{ slug: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Busca por slug y solo intenta el fallback por id cuando el parámetro es un
 * UUID — así los slugs inválidos no disparan errores 22P02 en Postgres.
 */
async function findService(slug: string) {
  const bySlug = await getServiceBySlug(slug)
  if (bySlug) return bySlug
  return UUID_RE.test(slug) ? getServiceById(slug) : null
}

export async function generateMetadata({ params }: ProfessionalServicePageProps): Promise<Metadata> {
  const { slug } = await params
  const response = await findService(slug)

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

  // Intentar buscar por slug primero; por ID solo si el parámetro es un UUID
  const response = await findService(slug)

  if (!response) {
    notFound()
  }

  const { service } = response

  // Lecturas del perfil en paralelo (todas cache()adas por request): sesión del
  // visitante, sub-servicios, Q&A y el contenido público del dueño (posts +
  // artículos). RLS ya filtra lo que cada sesión puede ver.
  const [viewer, offerings, questions, posts, articles] = await Promise.all([
    getCachedAuthUser(),
    listServiceOfferings(service.id),
    listServiceQuestions(service.id),
    getOwnerPublicPosts(service.userId, 3),
    getOwnerPublishedArticles(service.userId, 6),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      {/* Breadcrumb & Actions */}
      <div className="flex items-start justify-between gap-4">
        <ServiceBreadcrumb cityName={service.city.name} citySlug={service.city.slug} serviceName={service.name} />
        <ServiceActions serviceId={service.id} serviceName={service.name} />
      </div>

      {/* Perfil de servicio — distribución de 3 columnas (mockup pág. 9) */}
      <ProfileLayoutWrapper
        service={service}
        viewerId={viewer?.id ?? null}
        offerings={offerings}
        questions={questions}
        posts={posts}
        articles={articles}
      />
    </div>
  )
}
