import type { Route } from 'next'

export interface AdminNavItem {
  label: string
  href: Route | null
  iconName:
    | 'squares-2x2'
    | 'chat-bubble-left-right'
    | 'users'
    | 'cog'
  disabled?: boolean
  matchPrefix?: string
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin' as Route, iconName: 'squares-2x2', matchPrefix: '/admin' },
  {
    label: 'Foros',
    href: '/admin/foros' as Route,
    iconName: 'chat-bubble-left-right',
    matchPrefix: '/admin/foros',
  },
  {
    label: 'Usuarios',
    href: '/admin/usuarios' as Route,
    iconName: 'users',
    matchPrefix: '/admin/usuarios',
  },
  {
    label: 'Ajustes',
    href: '/admin/ajustes' as Route,
    iconName: 'cog',
    matchPrefix: '/admin/ajustes',
  },
]
