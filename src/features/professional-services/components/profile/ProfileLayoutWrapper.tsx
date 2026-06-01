'use client'

/**
 * ProfileLayoutWrapper
 *
 * Wrapper cliente para `ProfileLayout` que obtiene el usuario autenticado y lo
 * pasa como prop para determinar si mostrar el botón de editar (mismo patrón
 * que `ServiceHeaderWrapper`).
 */

import { useAuth } from '@/features/auth'
import { ProfessionalService } from '../../interfaces/professional-service.interfaces'
import { ProfileLayout } from './ProfileLayout'

interface ProfileLayoutWrapperProps {
  service: ProfessionalService
}

export function ProfileLayoutWrapper({ service }: ProfileLayoutWrapperProps) {
  const { user } = useAuth()

  return <ProfileLayout service={service} currentUserId={user?.id} />
}
