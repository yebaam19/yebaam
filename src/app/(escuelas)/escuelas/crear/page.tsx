import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { CreateSchoolForm } from '@/features/escuelas/components/public/CreateSchoolForm'

export const metadata: Metadata = {
  title: 'Registrar escuela | Yebaam',
}

export default async function CrearEscuelaPage() {
  await requireSession()

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Nav */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link
            href="/escuelas"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Escuelas
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-white shadow-sm">
              <GraduationCap size={22} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Registra tu escuela
              </h1>
              <p className="mt-1 text-sm leading-6 text-neutral-500">
                Completa la información básica ahora. Programas, instructores y galería los añades después desde el panel.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <main className="mx-auto max-w-2xl px-4 py-8" id="main-content">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <CreateSchoolForm />
          </div>
        </div>
      </main>
    </div>
  )
}
