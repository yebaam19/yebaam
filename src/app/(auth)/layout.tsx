import React, { FC } from 'react'
import { Toaster } from 'sonner'

import LanguageSwitch from '@/components/settings/LanguageSwitch'
import { LegalFooter } from '@/components/legal/LegalFooter'

interface Props {
  children?: React.ReactNode
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-white dark:bg-neutral-950">
      <div className="relative flex min-h-full flex-col">
        <div className="absolute top-4 start-4 z-[60]">
          <LanguageSwitch className="border-neutral-300/80 bg-white/90 shadow-sm backdrop-blur-sm dark:border-neutral-600 dark:bg-neutral-900/90" />
        </div>
        <div className="flex-1">{children}</div>
        <LegalFooter />
      </div>
      <Toaster position="top-center" richColors />
    </div>
  )
}

export default Layout
