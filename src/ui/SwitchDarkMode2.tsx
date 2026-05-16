'use client'

import { Switch } from '@headlessui/react'
import clsx from 'clsx'
import React from 'react'
import { useTranslations } from 'next-intl'
import { usePreferencesStore } from '@/stores/preferences.store'
import { useIsDarkMode } from '@/components/settings/ThemeSync'

interface SwitchDarkMode2Props {
  className?: string
}
const SwitchDarkMode2: React.FC<SwitchDarkMode2Props> = ({ className }) => {
  const t = useTranslations('avatar')
  const toggleDarkMode = usePreferencesStore((s) => s.toggleDarkMode)
  const isDarkMode = useIsDarkMode()

  return (
    <div className={clsx('inline-flex', className)}>
      <span className="sr-only">{t('darkModeToggleA11y')}</span>
      <Switch
        checked={isDarkMode}
        onChange={toggleDarkMode}
        className={`${isDarkMode ? 'bg-teal-900' : 'bg-teal-600'} relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/75`}
      >
        <span className="sr-only">{t('darkModeToggleA11y')}</span>
        <span
          aria-hidden="true"
          className={`${isDarkMode ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-[14px] w-[14px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
        />
      </Switch>
    </div>
  )
}

export default SwitchDarkMode2
