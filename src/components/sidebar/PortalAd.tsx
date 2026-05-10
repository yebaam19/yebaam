/**
 * PortalAd Component
 *
 * Right-rail card promoting the Music Archive (Latin American 1900–1970).
 * Repurposed from the older "Portal de la Salsa" card; the salsa portal still
 * lives at /feed/portals/salsa but is now reachable as a curated collection
 * inside the music archive.
 */

import { ArrowRightIcon, MusicalNoteIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import type { Route } from 'next'

export function PortalAd() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-linear-to-br from-red-500/10 via-amber-500/10 to-green-500/10 p-4 dark:border-neutral-700">
      <div className="mb-3 flex items-center gap-2">
        <MusicalNoteIcon className="size-5 text-amber-600" />
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Archivo Musical</h3>
      </div>

      <p className="mb-3 text-xs text-neutral-600 dark:text-neutral-400">
        Música latinoamericana 1900–1970. Sube, escucha y conecta con coleccionistas.
      </p>

      <Link
        href={'/musica' as Route}
        className="flex items-center justify-between rounded-lg bg-linear-to-r from-red-500 to-amber-500 px-3 py-2 text-xs font-medium text-white transition-all hover:from-red-600 hover:to-amber-600"
      >
        <span>Explorar Archivo</span>
        <ArrowRightIcon className="size-4" />
      </Link>
    </div>
  )
}
