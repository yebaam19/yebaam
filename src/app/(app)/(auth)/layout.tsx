import React, { FC } from 'react'
import { Toaster } from 'sonner'

interface Props {
  children?: React.ReactNode
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  )
}

export default Layout
