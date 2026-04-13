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
} from '@/components/icons/heroicons-shim'
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
    <article className="group relative flex h-full min-h-[8.5rem] cursor-pointer flex-col gap-4 overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:min-h-0 sm:flex-row sm:items-stretch sm:gap-4 sm:p-5 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="relative flex shrink-0 justify-center sm:justify-start sm:self-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl sm:h-[5.25rem] sm:w-[5.25rem]"
          style={{ backgroundColor: `${section.color}15` }}
        >
          <IconComponent className="h-7 w-7 sm:h-11 sm:w-11" style={{ color: section.color }} />
        </div>
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col text-center sm:text-left">
        <h4 className="text-balance text-base font-bold leading-snug text-neutral-900 sm:text-lg dark:text-white">
          {section.label}
        </h4>
        <p className="mt-1.5 line-clamp-3 text-pretty text-sm leading-relaxed text-neutral-600 sm:mt-2 sm:line-clamp-2 sm:text-sm dark:text-neutral-400">
          {section.description}
        </p>
        <div className="mt-auto flex justify-center pt-3 sm:justify-start sm:pt-4">
          <span className="inline-flex items-center rounded-full bg-amber-500/12 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-amber-700 uppercase dark:bg-amber-400/15 dark:text-amber-400">
            Próximamente
          </span>
        </div>
      </div>
    </article>
  )
}
