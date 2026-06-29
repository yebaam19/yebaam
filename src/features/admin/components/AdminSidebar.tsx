'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  AcademicCapIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  InboxArrowDownIcon,
  MusicalNoteIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  TrophyIcon,
  UsersIcon,
} from '@/components/icons/heroicons-shim'
import { ADMIN_NAV_ITEMS, type AdminNavItem } from '@/features/admin/nav'
import { useAuthStore } from '@/features/auth/store/auth.store'
import Image from 'next/image'
import YebaamLogo from '@/images/brand/Yebaam-Logo.png'
import { useTranslations } from 'next-intl'

// Maps the Spanish nav labels (defined in nav.ts) to translation keys under admin.nav.
const NAV_LABEL_TO_KEY: Record<string, string> = {
  'Dashboard': 'dashboard',
  'Foros': 'foros',
  'Chat Público': 'chatPublico',
  'Usuarios': 'usuarios',
  'Ciudades': 'ciudades',
  'Verificaciones': 'verifications',
  'Credenciales Profesionales': 'professionalCredentials',
  'Insignias': 'insignias',
  'Solicitudes de insignias': 'badgeRequests',
  'Club de coleccionistas': 'musicClub',
  'Ajustes': 'ajustes',
}

const ICONS: Record<AdminNavItem['iconName'], React.ComponentType<{ className?: string }>> = {
  'squares-2x2': Squares2X2Icon,
  'chat-bubble-left-right': ChatBubbleLeftRightIcon,
  'chat-bubble-left': ChatBubbleLeftIcon,
  users: UsersIcon,
  cog: Cog6ToothIcon,
  'shield-check': ShieldCheckIcon,
  'academic-cap': AcademicCapIcon,
  'musical-note': MusicalNoteIcon,
  'building-office-2': BuildingOffice2Icon,
  trophy: TrophyIcon,
  inbox: InboxArrowDownIcon,
}

interface Props {
  onNavigate?: () => void
}

export default function AdminSidebar({ onNavigate }: Props) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const [isLoggingOut, startLogout] = useTransition()
  const tShell = useTranslations('admin.shell')
  const tSidebar = useTranslations('admin.sidebar')
  const tNav = useTranslations('admin.nav')

  const navLabel = (label: string) => {
    const key = NAV_LABEL_TO_KEY[label]
    return key ? tNav(key) : label
  }

  const handleLogout = () => {
    startLogout(async () => {
      await logout()
      router.replace('/login')
    })
  }

  return (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-4 pt-5 pb-4 dark:border-neutral-800">
        <Link href={'/feed' as Route} className="flex h-7 shrink-0 items-center">
          <Image
            src={YebaamLogo}
            alt="Yebaam"
            className="h-full w-auto"
            style={{ width: 'auto' }}
            priority
          />
        </Link>
        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary-700 uppercase dark:bg-primary-900/30 dark:text-primary-300">
          {tShell('adminBadge')}
        </span>
      </div>
      <div className="px-4 pt-5 pb-3">
        <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
          {tSidebar('section')}
        </p>
      </div>
      <ul className="flex-1 space-y-1 px-2">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.iconName]
          const isActive =
            item.href != null &&
            (item.matchPrefix === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.matchPrefix ?? item.href))
          const base =
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors'
          if (item.disabled || !item.href) {
            return (
              <li key={item.label}>
                <span
                  className={`${base} cursor-not-allowed text-neutral-400 dark:text-neutral-600`}
                  title={tSidebar('soonTitle')}
                >
                  <Icon className="h-5 w-5" />
                  <span>{navLabel(item.label)}</span>
                  <span className="ml-auto rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-neutral-500 uppercase dark:bg-neutral-800">
                    {tSidebar('soon')}
                  </span>
                </span>
              </li>
            )
          }
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={`${base} ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                />
                <span>{navLabel(item.label)}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500"
                  />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
            />
          </svg>
          <span>{isLoggingOut ? tSidebar('loggingOut') : tSidebar('logout')}</span>
        </button>
      </div>
    </nav>
  )
}
