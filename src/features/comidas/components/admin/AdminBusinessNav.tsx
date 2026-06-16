'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard',        href: (id: string) => `/negocios/admin/${id}` },
  { label: 'Productos',        href: (id: string) => `/negocios/admin/${id}/productos` },
  { label: 'Promociones',      href: (id: string) => `/negocios/admin/${id}/promociones` },
  { label: 'Publicaciones',    href: (id: string) => `/negocios/admin/${id}/publicaciones` },
  { label: 'Media',            href: (id: string) => `/negocios/admin/${id}/media` },
  { label: 'Analytics',        href: (id: string) => `/negocios/admin/${id}/analytics` },
  { label: 'Administradores',  href: (id: string) => `/negocios/admin/${id}/administradores` },
  { label: 'Actividad',        href: (id: string) => `/negocios/admin/${id}/actividad` },
  { label: 'Configuración',    href: (id: string) => `/negocios/admin/${id}/settings` },
]

interface Props {
  businessId: string
}

export function AdminBusinessNav({ businessId }: Props) {
  const pathname = usePathname()

  return (
    <nav aria-label="Secciones del panel" className="flex overflow-x-auto gap-1 pb-1">
      {navItems.map(({ label, href }) => {
        const to = href(businessId)
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
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
