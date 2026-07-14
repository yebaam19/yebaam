'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen, Camera, GraduationCap, Inbox,
  LayoutDashboard, MapPin, MessageSquare, Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard',    slug: '',             icon: LayoutDashboard },
  { label: 'Programas',   slug: 'programas',    icon: BookOpen },
  { label: 'Instructores',slug: 'instructores', icon: GraduationCap },
  { label: 'Sedes',       slug: 'sedes',        icon: MapPin },
  { label: 'Media',       slug: 'media',        icon: Camera },
  { label: 'Leads',       slug: 'leads',        icon: Inbox },
  { label: 'Solicitudes', slug: 'solicitudes',  icon: MessageSquare },
  { label: 'Config.',     slug: 'settings',     icon: Settings },
]

export function AdminSchoolNav({ schoolId }: { schoolId: string }) {
  const pathname = usePathname()
  const base = `/escuelas/admin/${schoolId}`

  return (
    <nav aria-label="Secciones del panel" className="flex overflow-x-auto gap-0.5 scrollbar-hide -mx-1 px-1">
      {NAV_ITEMS.map(({ label, slug, icon: Icon }) => {
        const href = slug ? `${base}/${slug}` : base
        const isActive = slug
          ? pathname.startsWith(`${base}/${slug}`)
          : pathname === base
        return (
          <Link
            key={slug || 'dashboard'}
            href={href as never}
            className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm transition ${
              isActive
                ? 'bg-primary-50 text-primary-700 font-semibold'
                : 'font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
