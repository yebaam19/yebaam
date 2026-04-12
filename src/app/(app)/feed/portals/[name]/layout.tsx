/**
 * Portal Dynamic Layout
 *
 * Layout para portales específicos con menú lateral
 */

import { PortalMenu, getPortalConfig, getPortalMenuItems } from '@/features/portals'
import { notFound } from 'next/navigation'

interface PortalLayoutProps {
  children: React.ReactNode
  params: Promise<{ name: string }>
}

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const { name } = await params
  const config = getPortalConfig(name)

  if (!config) {
    return notFound()
  }

  const menuItems = getPortalMenuItems(name)

  return (
    <main className="flex w-full min-w-0 gap-5 px-5 pb-8">
      <PortalMenu portalSlug={name} menuItems={menuItems} />
      <div className="min-w-0 flex-1">{children}</div>
    </main>
  )
}
