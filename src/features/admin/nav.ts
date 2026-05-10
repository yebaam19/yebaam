import type { Route } from 'next'

export interface AdminNavItem {
  label: string
  href: Route | null
  iconName:
    | 'squares-2x2'
    | 'chat-bubble-left-right'
    | 'chat-bubble-left'
    | 'users'
    | 'cog'
    | 'shield-check'
    | 'academic-cap'
    | 'musical-note'
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
    label: 'Chat Público',
    href: '/admin/chat-publico' as Route,
    iconName: 'chat-bubble-left',
    matchPrefix: '/admin/chat-publico',
  },
  {
    label: 'Usuarios',
    href: '/admin/usuarios' as Route,
    iconName: 'users',
    matchPrefix: '/admin/usuarios',
  },
  {
    label: 'Verificaciones',
    href: '/admin/verifications' as Route,
    iconName: 'shield-check',
    matchPrefix: '/admin/verifications',
  },
  {
    label: 'Credenciales Profesionales',
    href: '/admin/professional-credentials' as Route,
    iconName: 'academic-cap',
    matchPrefix: '/admin/professional-credentials',
  },
  {
    label: 'Música',
    href: '/admin/music' as Route,
    iconName: 'musical-note',
    matchPrefix: '/admin/music',
  },
  {
    label: 'Ajustes',
    href: '/admin/ajustes' as Route,
    iconName: 'cog',
    matchPrefix: '/admin/ajustes',
  },
]
