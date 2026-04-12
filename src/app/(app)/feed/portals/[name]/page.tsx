/**
 * Portal Page
 *
 * Página principal de un portal específico
 */

import { PortalHeader, PortalTabs, getPortalConfig } from '@/features/portals'
import SalsaBg from '@/images/salsa.jpg'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface PortalPageProps {
  params: Promise<{ name: string }>
}

export async function generateMetadata({ params }: PortalPageProps): Promise<Metadata> {
  const { name } = await params
  const config = getPortalConfig(name)

  if (!config) {
    return {}
  }

  return {
    title: `${config.title} - ${config.subtitle}`,
    description: config.description,
  }
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { name } = await params
  const config = getPortalConfig(name)

  if (!config) {
    return notFound()
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      <PortalHeader
        title={config.title}
        subtitle={config.subtitle}
        description={config.description}
        heroImage={SalsaBg}
      />
      <PortalTabs sections={config.sections} />
    </div>
  )
}
