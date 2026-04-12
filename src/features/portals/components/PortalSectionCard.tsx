/**
 * PortalSectionCard Component
 *
 * Card que muestra una sección del portal con icono y descripción
 */

import {
  AcademicCapIcon,
  BuildingStorefrontIcon,
  GlobeAltIcon,
  MapIcon,
  MapPinIcon,
  MusicalNoteIcon,
  PhotoIcon,
  UserGroupIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'
import { PortalSection } from '../interfaces'

const iconMap = {
  GlobeAltIcon,
  UserGroupIcon,
  MapPinIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  BuildingStorefrontIcon,
  PhotoIcon,
  VideoCameraIcon,
  MapIcon,
}

interface PortalSectionCardProps {
  section: PortalSection
}

export function PortalSectionCard({ section }: PortalSectionCardProps) {
  const IconComponent = iconMap[section.icon]

  return (
    <div className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800">
      {/* Icon container con background */}
      <div className="relative shrink-0">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${section.color}15` }}
        >
          <IconComponent className="h-12 w-12" style={{ color: section.color }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative min-w-0 flex-1">
        <h4 className="mb-2 text-xl leading-5 font-bold text-neutral-900 dark:text-white">{section.label}</h4>
        <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">{section.description}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-amber-600 uppercase">Próximamente</span>
        </div>
      </div>
    </div>
  )
}
