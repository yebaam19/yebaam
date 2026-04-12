/**
 * Portals Feature
 *
 * Feature para portales temáticos de la plataforma.
 * Actualmente incluye el Portal de la Salsa de Cali.
 *
 * @example
 * ```tsx
 * import { PortalHeader, PortalMenu, PortalTabs } from '@/features/portals'
 * import { getPortalConfig, getPortalMenuItems } from '@/features/portals'
 *
 * export default function PortalPage({ params }) {
 *   const config = getPortalConfig(params.name)
 *   const menuItems = getPortalMenuItems(params.name)
 *
 *   return (
 *     <>
 *       <PortalMenu portalSlug={params.name} menuItems={menuItems} />
 *       <div>
 *         <PortalHeader {...config} />
 *         <PortalTabs sections={config.sections} />
 *       </div>
 *     </>
 *   )
 * }
 * ```
 */

// Interfaces y tipos
export * from './interfaces';

// Datos y configuración
export * from './data';

// Componentes
export * from './components';
