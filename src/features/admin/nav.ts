import type { Route } from 'next'

export interface AdminNavItem {
  label: string
  href: Route | null
  iconName:
    | 'squares-2x2'
    | 'chat-bubble-left-right'
    | 'users'
    | 'flag'
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
  { label: 'Usuarios', href: null, iconName: 'users', disabled: true },
  { label: 'Reportes', href: null, iconName: 'flag', disabled: true },
  { label: 'Ajustes', href: null, iconName: 'cog', disabled: true },
]
