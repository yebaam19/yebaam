'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard',       href: (id: string) => `/negocios/admin/${id}` },
  { label: 'Productos',       href: (id: string) => `/negocios/admin/${id}/productos` },
  { label: 'Promociones',     href: (id: string) => `/negocios/admin/${id}/promociones` },
  { label: 'Media',           href: (id: string) => `/negocios/admin/${id}/media` },
  { label: 'Publicaciones',   href: (id: string) => `/negocios/admin/${id}/publicaciones` },
  { label: 'Actividad',       href: (id: string) => `/negocios/admin/${id}/actividad` },
  { label: 'Administradores', href: (id: string) => `/negocios/admin/${id}/administradores` },
]

interface Props {
  businessId: string
}

export function AdminBusinessNav({ businessId }: Props) {
  const pathname = usePathname()

  return (
    <nav className="flex overflow-x-auto gap-1 pb-1">
      {navItems.map(({ label, href }) => {
        const to = href(businessId)
        // Exact match for dashboard, prefix match for sub-pages
        const isActive = to === `/negocios/admin/${businessId}`
          ? pathname === to
          : pathname.startsWith(to)
        return (
          <Link
            key={label}
            href={to as never}
            className={cn(
              'shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-700 text-white'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
