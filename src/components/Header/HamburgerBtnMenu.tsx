'use client'

import { Menu01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useTranslations } from 'next-intl'
import { useAside } from '../aside'

const HamburgerBtnMenu = () => {
  const { open: openAside } = useAside()
  const t = useTranslations('nav')

  return (
    <button
      type="button"
      onClick={() => openAside('sidebar-navigation')}
      className="-m-2.5 flex cursor-pointer items-center justify-center rounded-full p-2.5 hover:bg-neutral-100 focus-visible:outline-0 dark:hover:bg-neutral-700"
    >
      <span className="sr-only">{t('openMainMenu')}</span>
      <HugeiconsIcon icon={Menu01Icon} size={24} color="currentColor" strokeWidth={1.5} />
    </button>
  )
}

export default HamburgerBtnMenu
