/**
 * Businesses Listing Page
 *
 * Página principal del listado de negocios.
 * Ruta: /feed/businesses
 */

import { BusinessesListingContainer } from '@/features/businesses'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Negocios | Descubre negocios locales',
  description:
    'Explora y descubre negocios locales en tu comunidad. Encuentra restaurantes, tiendas, servicios y más cerca de ti.',
  keywords: ['negocios', 'locales', 'empresas', 'comercios', 'servicios', 'directorio'],
  openGraph: {
    title: 'Negocios | Descubre negocios locales',
    description: 'Explora y descubre negocios locales en tu comunidad.',
    type: 'website',
  },
}

export default function BusinessesPage() {
  return (
    <div className="container mx-auto max-w-7xl p-5">
      <BusinessesListingContainer />
    </div>
  )
}
