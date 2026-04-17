import type { Metadata } from 'next'
import { Suspense } from 'react'

import { ClubesPageContainer } from './ClubesPageContainer'

export const metadata: Metadata = {
  title: 'Clubes | Comunidades y Grupos de Interés',
  description:
    'Descubre y únete a clubes basados en tus intereses. Conecta con personas afines, participa en eventos exclusivos y comparte experiencias únicas en comunidades temáticas.',
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
    title: 'Clubes | Comunidades y Grupos de Interés',
    description: 'Descubre comunidades apasionadas sobre los temas que te interesan',
    type: 'website',
  },
}

export default function ClubesPage() {
  return (
    <Suspense>
      <ClubesPageContainer />
    </Suspense>
  )
}
