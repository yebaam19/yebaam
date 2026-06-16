import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { BusinessForm } from '@/features/comidas/components/admin/BusinessForm'

export const metadata: Metadata = {
  title: 'Registrar negocio — Yebaam',
}

export default async function CrearNegocioPage() {
  await requireSession()

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* Barra de navegación superior */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link
            href="/negocios"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Negocios
          </Link>
        </div>
      </div>

      {/* Hero del formulario */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-white shadow-sm"
              aria-hidden="true"
            >
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Registra tu negocio
              </h1>
              <p className="mt-1 text-sm leading-6 text-neutral-500">
                Completa lo esencial ahora. Fotos, productos y promociones
                los añades después desde el dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <main className="mx-auto max-w-2xl px-4 py-8" id="main-content">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <BusinessForm />
          </div>
        </div>
      </main>

    </div>
  )
}
