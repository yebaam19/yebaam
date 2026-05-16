'use client'

import { SunIcon } from '@/components/icons/heroicons-shim'
import { MoonIcon } from '@/components/icons/heroicons-shim'
import React from 'react'
import { useTranslations } from 'next-intl'
import { usePreferencesStore } from '@/stores/preferences.store'
import { useIsDarkMode } from '@/components/settings/ThemeSync'

interface SwitchDarkModeProps {
  className?: string
}
const SwitchDarkMode: React.FC<SwitchDarkModeProps> = ({ className = '' }) => {
  const t = useTranslations('avatar')
  const toggleDarkMode = usePreferencesStore((s) => s.toggleDarkMode)
  const isDarkMode = useIsDarkMode()

  return (
    <button
      onClick={toggleDarkMode}
      className={`flex h-12 w-12 items-center justify-center self-center rounded-full text-2xl text-neutral-700 hover:bg-neutral-100 focus:outline-hidden md:text-3xl dark:text-neutral-300 dark:hover:bg-neutral-800 ${className}`}
    >
      <span className="sr-only">{t('darkModeToggleA11y')}</span>
      {isDarkMode ? (
        <MoonIcon className="h-7 w-7" aria-hidden="true" />
      ) : (
        <SunIcon className="h-7 w-7" aria-hidden="true" />
      )}
    </button>
  )
}

export default SwitchDarkMode
