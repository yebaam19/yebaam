'use client'

import clsx from 'clsx'
import { usePreferencesStore, type ThemeMode } from '@/stores/preferences.store'
import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'

interface Option {
  value: ThemeMode
  label: string
  description: string
  Icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export default function ThemeSettings() {
  const themeMode = usePreferencesStore((s) => s.theme)
  const setTheme = usePreferencesStore((s) => s.setTheme)
  const t = useTranslations('admin.theme')

  const OPTIONS: Option[] = [
    { value: 'light', label: t('light'), description: t('lightDescription'), Icon: SunIcon },
    { value: 'dark', label: t('dark'), description: t('darkDescription'), Icon: MoonIcon },
    {
      value: 'system',
      label: t('system'),
      description: t('systemDescription'),
      Icon: ComputerDesktopIcon,
      badge: t('recommended'),
    },
  ]

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          {t('heading')}
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          {t('description')}
        </p>
      </header>

      <fieldset className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
        <legend className="sr-only">{t('legend')}</legend>
        {OPTIONS.map(({ value, label, description, Icon, badge }) => {
          const active = themeMode === value
          return (
            <label
              key={value}
              className={clsx(
                'group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors',
                active
                  ? 'border-primary-500 bg-primary-50/70 ring-1 ring-primary-500 dark:border-primary-400 dark:bg-primary-900/20 dark:ring-primary-400'
                  : 'border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-900/60 dark:hover:bg-primary-900/10',
              )}
            >
              <input
                type="radio"
                name="theme-mode"
                value={value}
                checked={active}
                onChange={() => setTheme(value)}
                className="sr-only"
              />
              <div className="flex items-center justify-between gap-2">
                <span
                  className={clsx(
                    'inline-flex rounded-lg p-2',
                    active
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {badge && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-300">
                    {badge}
                  </span>
                )}
                {active && !badge && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3 w-3"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 111.42-1.42l3.29 3.29 7.29-7.29a1 1 0 011.42 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
              <div>
                <div
                  className={clsx(
                    'text-sm font-semibold',
                    active
                      ? 'text-primary-800 dark:text-primary-200'
                      : 'text-neutral-900 dark:text-neutral-100',
                  )}
                >
                  {label}
                </div>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
              </div>
            </label>
          )
        })}
      </fieldset>
    </section>
  )
}
