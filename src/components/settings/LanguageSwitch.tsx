'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { usePreferencesStore } from '@/stores/preferences.store'
import { LOCALES, type Locale } from '@/i18n/locales'
import clsx from 'clsx'

interface LanguageSwitchProps {
  className?: string
}

export default function LanguageSwitch({ className }: LanguageSwitchProps) {
  const t = useTranslations('avatar')
  const router = useRouter()
  const locale = usePreferencesStore((s) => s.locale)
  const setLocale = usePreferencesStore((s) => s.setLocale)

  const handleChange = (next: Locale) => {
    if (next === locale) return
    setLocale(next)
    router.refresh()
  }

  return (
    <div
      role="group"
      aria-label={t('language')}
      className={clsx(
        'inline-flex items-center gap-0.5 rounded-full border border-neutral-200 bg-neutral-100 p-0.5 text-xs font-semibold dark:border-neutral-700 dark:bg-neutral-800',
        className,
      )}
    >
      {LOCALES.map((code) => {
        const active = locale === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => handleChange(code)}
            aria-pressed={active}
            className={clsx(
              'rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              active
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200',
            )}
          >
            {code}
          </button>
        )
      })}
    </div>
  )
}
