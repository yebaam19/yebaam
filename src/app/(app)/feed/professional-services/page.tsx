import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Servicios Profesionales | Encuentra Expertos Cerca de Ti',
  description:
    'Explora nuestro directorio de servicios profesionales. Encuentra abogados, contadores, médicos, desarrolladores y más profesionales verificados en tu ciudad.',
  keywords: [
    'servicios profesionales',
    'directorio profesionales',
    'abogados',
    'contadores',
    'médicos',
    'arquitectos',
    'desarrolladores',
    'Colombia',
  ],
  openGraph: {
    title: 'Servicios Profesionales',
    description: 'Encuentra profesionales verificados para todas tus necesidades',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

export default function ProfessionalServicesPage() {
  return (
    <main className="mx-auto flex min-h-[62vh] w-full max-w-2xl items-center justify-center px-6">
      <section className="w-full text-center">
        <p className="mb-3 text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase dark:text-neutral-400">
          Proximamente
        </p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Servicios Profesionales
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          Estamos afinando esta seccion para que puedas encontrar profesionales verificados de forma simple y
          confiable.
        </p>
        <Link
          href="/feed"
          className="mt-8 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4 transition-colors hover:text-neutral-600 dark:text-neutral-100 dark:hover:text-neutral-300"
        >
          Volver al feed
        </Link>
      </section>
    </main>
  )
}
