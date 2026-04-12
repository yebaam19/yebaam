/**
 * PortalSectionsGrid Component
 *
 * Grid que muestra todas las secciones de un portal
 */

import { PortalSection } from '../interfaces'
import { PortalSectionCard } from './PortalSectionCard'

interface PortalSectionsGridProps {
  sections: PortalSection[]
}

export function PortalSectionsGrid({ sections }: PortalSectionsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {sections.map((section) => (
        <PortalSectionCard key={section.id} section={section} />
      ))}
    </div>
  )
}
