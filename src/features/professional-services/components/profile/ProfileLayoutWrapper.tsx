'use client'

/**
 * ProfileLayoutWrapper
 *
 * Frontera server→cliente del perfil de servicio: recibe del RSC de la página
 * el servicio y las lecturas hechas en el servidor (visitante, sub-servicios,
 * Q&A, posts y artículos del dueño) y las baja tipadas a `ProfileLayout`.
 * El `viewerId` viene de `getCachedAuthUser()` en el servidor — una sola
 * fuente de verdad para `isOwner` (sin flash de hidratación de `useAuth`).
 */

import type { ProfessionalService } from '../../interfaces/professional-service.interfaces'
import type { ServiceOffering } from '../../server/offerings.server'
import type { OwnerArticleCard, OwnerPostCard } from '../../server/owner-content.server'
import type { ServiceQuestion } from '../../server/questions.server'
import { ProfileLayout } from './ProfileLayout'

interface ProfileLayoutWrapperProps {
  service: ProfessionalService
  /** Usuario con sesión que mira la página (null = anónimo), leído en el RSC. */
  viewerId: string | null
  offerings: ServiceOffering[]
  questions: ServiceQuestion[]
  posts: OwnerPostCard[]
  articles: OwnerArticleCard[]
}

export function ProfileLayoutWrapper({
  service,
  viewerId,
  offerings,
  questions,
  posts,
  articles,
}: ProfileLayoutWrapperProps) {
  return (
    <ProfileLayout
      service={service}
      viewerId={viewerId}
      offerings={offerings}
      questions={questions}
      posts={posts}
      articles={articles}
    />
  )
}
