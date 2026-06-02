'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { PlusIcon } from '@/components/icons/heroicons-shim'
import { servicesByUserIdAction } from '../../actions/services.actions'
import type { ProfessionalServiceBasic } from '../../interfaces/professional-service.interfaces'
import { PROFESSIONAL_SERVICES_PATH } from '../../constants/routes'
import { ServicesGrid } from '../listing/ServicesGrid'

interface UserServicesPanelProps {
  /** The auth user id whose professional services to show. */
  userId: string
  isOwner: boolean
}

/**
 * "Mis servicios" — the user-profile tab required by the PDF: a visible tab on
 * the professional profile that surfaces that person's professional services.
 */
export function UserServicesPanel({ userId, isOwner }: UserServicesPanelProps) {
  const [services, setServices] = useState<ProfessionalServiceBasic[] | null>(null)

  useEffect(() => {
    let cancelled = false
    servicesByUserIdAction(userId)
      .then((rows) => {
        if (!cancelled) setServices(rows)
      })
      .catch(() => {
        if (!cancelled) setServices([])
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (services === null) {
    return <ServicesGrid services={[]} isLoading />
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-14 text-center dark:border-neutral-700">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <PlusIcon className="h-7 w-7 text-neutral-400" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-neutral-900 dark:text-white">
          {isOwner ? 'Aún no tienes servicios profesionales' : 'Sin servicios profesionales'}
        </h3>
        <p className="mb-5 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
          {isOwner
            ? 'Publica tu primer servicio profesional para que la comunidad pueda encontrarte en el directorio.'
            : 'Esta persona aún no ha publicado servicios profesionales.'}
        </p>
        {isOwner && (
          <Link
            href={PROFESSIONAL_SERVICES_PATH}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4" />
            Crear servicio profesional
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
          {services.length} servicio{services.length !== 1 ? 's' : ''} profesional{services.length !== 1 ? 'es' : ''}
        </h3>
        <Link
          href={PROFESSIONAL_SERVICES_PATH}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Ver directorio
        </Link>
      </div>
      <ServicesGrid services={services} isLoading={false} />
    </div>
  )
}
