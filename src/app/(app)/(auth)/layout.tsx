import React, { FC } from 'react'
import { Toaster } from 'sonner'

interface Props {
  children?: React.ReactNode
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <div className="min-h-dvh min-w-0">
      <div className="mx-auto min-h-dvh w-full max-w-full px-4 py-6 sm:px-6">{children}</div>
      <Toaster position="top-center" richColors />
    </div>
  )
}

export default Layout
