/**
 * PortalAd Component
 *
 * Anuncio promocional del Portal de la Salsa
 */

import { ArrowRightIcon, MusicalNoteIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export function PortalAd() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-linear-to-br from-red-500/10 via-amber-500/10 to-green-500/10 p-4 dark:border-neutral-700">
      <div className="mb-3 flex items-center gap-2">
        <MusicalNoteIcon className="size-5 text-amber-600" />
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Portal de la Salsa</h3>
      </div>

      <p className="mb-3 text-xs text-neutral-600 dark:text-neutral-400">
        Descubre la capital mundial de la salsa: historia, iconos, lugares y la cultura salsera de Cali
      </p>

      <Link
        href="/feed/portals/salsa"
        className="flex items-center justify-between rounded-lg bg-linear-to-r from-red-500 to-amber-500 px-3 py-2 text-xs font-medium text-white transition-all hover:from-red-600 hover:to-amber-600"
      >
        <span>Explorar Portal</span>
        <ArrowRightIcon className="size-4" />
      </Link>
    </div>
  )
}
