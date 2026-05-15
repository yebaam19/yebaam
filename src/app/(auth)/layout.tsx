import React, { FC } from 'react'
import { Toaster } from 'sonner'

interface Props {
  children?: React.ReactNode
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-white dark:bg-neutral-950">
      {children}
      <Toaster position="top-center" richColors />
    </div>
  )
}

export default Layout
