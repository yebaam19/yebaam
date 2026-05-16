'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { usePreferencesStore } from '@/stores/preferences.store'
import { LOCALES, type Locale } from '@/i18n/locales'
import clsx from 'clsx'

/** SVG flags — Unicode flag emojis render as “ES”/“US” letters on Windows. */
function FlagSpain({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 3 2"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#AA151B" width="3" height="2" />
      <rect fill="#F1BF00" y="0.5" width="3" height="1" />
    </svg>
  )
}

function FlagUsa({ className }: { className?: string }) {
  const stripeH = 10 / 13
  const cantonH = 7 * stripeH
  return (
    <svg
      className={className}
      viewBox="0 0 19 10"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {Array.from({ length: 13 }, (_, i) => (
        <rect
          key={i}
          x={0}
          y={i * stripeH}
          width={19}
          height={stripeH}
          fill={i % 2 === 0 ? '#B22234' : '#FFFFFF'}
        />
      ))}
      <rect x={0} y={0} width={7.6} height={cantonH} fill="#3C3B6E" />
    </svg>
  )
}

function LocaleFlagIcon({ locale }: { locale: Locale }) {
  const cls =
    'h-3.5 w-auto shrink-0 overflow-hidden rounded-[1px] border border-neutral-300/90 dark:border-neutral-600/90'
  if (locale === 'es') {
    return <FlagSpain className={clsx(cls, 'aspect-3/2')} />
  }
  return <FlagUsa className={clsx(cls, 'aspect-19/10')} />
}

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
        const labelKey = code === 'es' ? 'languageEs' : 'languageEn'
        return (
          <button
            key={code}
            type="button"
            onClick={() => handleChange(code)}
            aria-pressed={active}
            aria-label={t(labelKey)}
            className={clsx(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              active
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200',
            )}
          >
            <LocaleFlagIcon locale={code} />
            <span>{code}</span>
          </button>
        )
      })}
    </div>
  )
}
