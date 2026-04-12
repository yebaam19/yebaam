/**
 * Businesses Feature
 *
 * Feature completa para la gestión de negocios locales.
 * Incluye listado, perfil, creación y edición de negocios.
 *
 * @example
 * ```tsx
 * import { BusinessesListingContainer, BusinessProfileContainer } from '@/features/businesses'
 *
 * // En la página de listado
 * export default function BusinessesPage() {
 *   return <BusinessesListingContainer />
 * }
 *
 * // En la página de perfil
 * export default function BusinessProfilePage({ business }) {
 *   return <BusinessProfileContainer business={business} />
 * }
 * ```
 */

// Interfaces y tipos
export * from './interfaces'



// Servicios
export * from './services'

// Store de UI
export * from './store'

// Hooks
export * from './hooks'

// Componentes
export * from './components'
