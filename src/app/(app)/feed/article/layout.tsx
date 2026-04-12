/**
 * Article Layout
 *
 * Shared layout for all article pages
 */

import { ReactNode } from 'react'

interface ArticleLayoutProps {
  children: ReactNode
}

export default function ArticleLayout({ children }: ArticleLayoutProps) {
  // Compensar el padding del layout padre con margin negativo
  // para que el fondo blanco llegue hasta el header
  return (
    <div className="-mt-[106px] min-h-screen bg-white pt-[106px] md:-mt-14 md:pt-14 dark:bg-neutral-900">
      {children}
    </div>
  )
}
