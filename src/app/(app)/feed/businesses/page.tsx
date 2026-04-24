import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Negocios | Descubre negocios locales',
  description:
    'Explora y descubre negocios locales en tu comunidad. Encuentra restaurantes, tiendas, servicios y más cerca de ti.',
  keywords: ['negocios', 'locales', 'empresas', 'comercios', 'servicios', 'directorio'],
  openGraph: {
    title: 'Negocios | Descubre negocios locales',
    description: 'Explora y descubre negocios locales en tu comunidad.',
    type: 'website',
  },
}

export default function BusinessesPage() {
  return (
    <main className="mx-auto flex min-h-[62vh] w-full max-w-2xl items-center justify-center px-6">
      <section className="w-full text-center">
        <p className="mb-3 text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase dark:text-neutral-400">
          Proximamente
        </p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Negocios
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          Estamos preparando esta seccion para publicar el directorio con una experiencia mas solida y consistente.
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
