import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ThemeSettings from '@/features/admin/components/ThemeSettings'
import LanguageSwitch from '@/components/settings/LanguageSwitch'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings')
  return { title: t('title') }
}

export default async function AjustesPage() {
  const t = await getTranslations('settings')

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {t('subtitle')}
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <ThemeSettings />

        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {t('language')}
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                {t('languageDescription')}
              </p>
            </div>
            <LanguageSwitch />
          </header>
        </section>
      </div>
    </div>
  )
}
