import { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('businesses')
  return {
    title: t('metadata.listTitle'),
    description: t('metadata.listDescription'),
    keywords: ['negocios', 'locales', 'empresas', 'comercios', 'servicios', 'directorio'],
    openGraph: {
      title: t('metadata.ogTitle'),
      description: t('metadata.ogDescription'),
      type: 'website',
    },
  }
}

export default async function BusinessesPage() {
  const t = await getTranslations('businesses')
  return (
    <main className="mx-auto flex min-h-[62vh] w-full max-w-2xl items-center justify-center px-6">
      <section className="w-full text-center">
        <p className="mb-3 text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase dark:text-neutral-400">
          {t('comingSoon.eyebrow')}
        </p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          {t('comingSoon.title')}
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {t('comingSoon.description')}
        </p>
        <Link
          href="/feed"
          className="mt-8 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4 transition-colors hover:text-neutral-600 dark:text-neutral-100 dark:hover:text-neutral-300"
        >
          {t('comingSoon.backToFeed')}
        </Link>
      </section>
    </main>
  )
}
