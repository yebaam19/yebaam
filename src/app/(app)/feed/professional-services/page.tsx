import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('professional')
  return {
    title: t('servicesMetadata.title'),
    description: t('servicesMetadata.description'),
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
      title: t('servicesMetadata.ogTitle'),
      description: t('servicesMetadata.ogDescription'),
      type: 'website',
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function ProfessionalServicesPage() {
  const t = await getTranslations('professional')
  return (
    <main className="mx-auto flex min-h-[62vh] w-full max-w-2xl items-center justify-center px-6">
      <section className="w-full text-center">
        <p className="mb-3 text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase dark:text-neutral-400">
          {t('servicesComingSoon.eyebrow')}
        </p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          {t('servicesComingSoon.title')}
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {t('servicesComingSoon.description')}
        </p>
        <Link
          href="/feed"
          className="mt-8 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4 transition-colors hover:text-neutral-600 dark:text-neutral-100 dark:hover:text-neutral-300"
        >
          {t('servicesComingSoon.backToFeed')}
        </Link>
      </section>
    </main>
  )
}
