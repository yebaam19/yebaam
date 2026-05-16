/**
 * Portal Page
 *
 * Página principal de un portal específico
 */

import { PortalHeader, PortalTabs, getPortalConfig } from '@/features/portals'
import SalsaBg from '@/images/salsa.jpg'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

interface PortalPageProps {
  params: Promise<{ name: string }>
}

export async function generateMetadata({ params }: PortalPageProps): Promise<Metadata> {
  const { name } = await params
  const config = getPortalConfig(name)

  if (!config) {
    return {}
  }

  const t = await getTranslations()
  return {
    title: `${t(config.title)} - ${t(config.subtitle)}`,
    description: t(config.description),
  }
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { name } = await params
  const config = getPortalConfig(name)

  if (!config) {
    return notFound()
  }

  const t = await getTranslations()
  return (
    <div className="w-full min-w-0 space-y-5">
      <PortalHeader
        title={t(config.title)}
        subtitle={t(config.subtitle)}
        description={t(config.description)}
        heroImage={SalsaBg}
      />
      <PortalTabs sections={config.sections} />
    </div>
  )
}
