'use client'

/**
 * ServiceHeaderWrapper Component
 *
 * Wrapper cliente para ServiceHeader que obtiene el usuario autenticado
 * y lo pasa como prop para determinar si mostrar el botón de editar.
 */

import { useAuth } from '@/features/auth'
import { ProfessionalService } from '../../interfaces/professional-service.interfaces'
import { ServiceHeader } from '../ServiceHeader'

interface ServiceHeaderWrapperProps {
  service: ProfessionalService
}

export function ServiceHeaderWrapper({ service }: ServiceHeaderWrapperProps) {
  const { user } = useAuth()

  return <ServiceHeader service={service} currentUserId={user?.id} />
}
