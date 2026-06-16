'use client'

import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { useEffect } from 'react'

// One level above [businessId]/ on purpose: an error boundary doesn't catch
// errors thrown by a layout in its own segment, only in parent segments.
// This is what stops a single broken RPC from taking down the whole
// /negocios/admin/[businessId]/* dashboard with the global Sentry crash page.
export default function AdminBusinessError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-5xl">⚠️</span>
      <p className="text-lg font-semibold text-neutral-700">No pudimos cargar el panel de este negocio</p>
      <p className="max-w-sm text-sm text-neutral-500">
        Ocurrió un error inesperado administrando este negocio. Ya quedó registrado para revisión.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-primary-700 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-800"
        >
          Reintentar
        </button>
        <Link
          href="/feed/mis-negocios"
          className="rounded-full border border-neutral-200 px-6 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Volver a Mis Negocios
        </Link>
      </div>
    </main>
  )
}
