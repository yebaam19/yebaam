import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { BusinessForm } from '@/features/comidas/components/admin/BusinessForm'

export const metadata: Metadata = {
  title: 'Registrar negocio — Yebaam',
}

export default async function CrearNegocioPage() {
  await requireSession()

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/negocios"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Negocios
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-neutral-900">Registrar negocio</h1>
        <p className="mt-1 mb-8 text-sm text-neutral-500">
          Crea el perfil de tu negocio. Podrás completarlo desde el dashboard.
        </p>

        <BusinessForm />
      </div>
    </main>
  )
}
