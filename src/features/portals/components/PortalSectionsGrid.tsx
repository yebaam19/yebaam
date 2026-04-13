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
    <ul
      className="grid list-none grid-cols-1 gap-4 p-0 sm:gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3 xl:gap-5"
      role="list"
    >
      {sections.map((section) => (
        <li key={section.id} className="min-w-0">
          <PortalSectionCard section={section} />
        </li>
      ))}
    </ul>
  )
}
