import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'

import { ClubesPageContainer } from './ClubesPageContainer'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('clubes')
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    keywords: [
      'clubes',
      'comunidades',
      'grupos de interés',
      'networking',
      'eventos',
      'actividades',
      'conexiones',
      'aficiones',
      'red social',
    ],
    openGraph: {
      title: t('metadata.ogTitle'),
      description: t('metadata.ogDescription'),
      type: 'website',
    },
  }
}

export default function ClubesPage() {
  return (
    <Suspense>
      <ClubesPageContainer />
    </Suspense>
  )
}
