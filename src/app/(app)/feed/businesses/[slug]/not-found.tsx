/**
 * Business Not Found Page
 *
 * Página de error 404 para negocios no encontrados.
 */

import { BuildingStorefrontIcon, HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function BusinessNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <BuildingStorefrontIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">Negocio no encontrado</h1>

        {/* Description */}
        <p className="mb-8 max-w-md text-neutral-600 dark:text-neutral-400">
          El negocio que buscas no existe o ha sido eliminado. Puedes explorar otros negocios disponibles en nuestra
          plataforma.
        </p>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/feed/businesses"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            Explorar negocios
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
