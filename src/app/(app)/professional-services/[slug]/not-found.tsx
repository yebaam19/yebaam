/**
 * Professional Service Not Found Page
 *
 * Página de error 404 para servicios profesionales no encontrados.
 */

import { BriefcaseIcon, HomeIcon, MagnifyingGlassIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'

import { PROFESSIONAL_SERVICES_PATH } from '@/features/professional-services/constants/routes'

export default function ServiceNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
          <BriefcaseIcon className="h-12 w-12 text-primary-600 dark:text-primary-400" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Servicio profesional no encontrado
        </h1>

        {/* Description */}
        <p className="mb-8 max-w-md text-neutral-600 dark:text-neutral-400">
          El servicio profesional que buscas no existe o ha sido eliminado. Puedes explorar otros servicios disponibles
          en nuestra plataforma.
        </p>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={PROFESSIONAL_SERVICES_PATH}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            Explorar servicios
          </Link>

          <Link
            href="/feed"
            className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <HomeIcon className="h-5 w-5" />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
