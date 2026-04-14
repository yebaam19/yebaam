'use client'

import { useAuth } from '@/features/auth/context/auth-context'
import Avatar from '@/ui/Avatar'
import { Divider } from '@/ui/divider'
import SwitchDarkMode2 from '@/ui/SwitchDarkMode2'
import { useRouter } from 'next/navigation'

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Idea01Icon, Logout01Icon, UserIcon, UserMultiple02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'

interface Props {
  className?: string
  isPlatformAdmin?: boolean
}

export default function AvatarDropdown({ className, isPlatformAdmin }: Props) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    // Forzar recarga completa para limpiar estado y evitar mostrar Header
    window.location.href = '/'
  }

  if (!user) return null

  const displayName = user.username
  const userAvatar = user.avatarUrl || user.avatar

  return (
    <div className={className}>
      <Popover>
        <PopoverButton className="-m-1.5 flex cursor-pointer items-center justify-center rounded-full p-1.5 hover:bg-neutral-100 focus-visible:outline-hidden dark:hover:bg-neutral-800">
          <Avatar className="size-8" src={userAvatar} initials={displayName?.slice(0, 2).toUpperCase()} />
        </PopoverButton>

        <PopoverPanel
          transition
          anchor={{
            to: 'bottom end',
            gap: 16,
          }}
          className="z-40 w-80 rounded-3xl shadow-lg ring-1 ring-black/5 transition duration-200 ease-in-out data-closed:translate-y-1 data-closed:opacity-0"
        >
          <div className="relative grid grid-cols-1 gap-6 bg-white px-6 py-7 dark:bg-neutral-800">
            {/* User Info */}
            <Link
              href={`/${user.username}`}
              className="flex items-center space-x-3 transition-opacity hover:opacity-80"
            >
              <Avatar className="size-12" src={userAvatar} initials={displayName?.slice(0, 2).toUpperCase()} />

              <div className="grow">
                <h4 className="font-semibold text-neutral-900 dark:text-white">{displayName}</h4>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">@{user.username}</p>
              </div>
            </Link>

            <Divider />

            {/* Mi Perfil */}
            <Link
              href={`/${user.username}`}
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={UserIcon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">Ver perfil</p>
            </Link>

            {/* Mis Amigos */}
            <Link
              href="/feed/friends"
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={UserMultiple02Icon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">Amigos</p>
            </Link>

            {/* Mis Fotos */}
            {/* <Link
              href={`/${user.username}/fotos`}
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={Image02Icon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">Fotos</p>
            </Link> */}

            {/* Mis Videos */}
            {/* <Link
              href={`/${user.username}/videos`}
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={VideoReplayIcon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">Videos</p>
            </Link> */}

            <Divider />

            {/* Configuración */}
            {/* <Link
              href="/configuracion"
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={Settings02Icon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">Configuración</p>
            </Link> */}

            {/* Dark Mode Toggle */}
            <div className="focus-visible:ring-opacity-50 -m-3 flex items-center justify-between rounded-lg p-2 hover:bg-neutral-100 focus:outline-none focus-visible:ring focus-visible:ring-primary-500 dark:hover:bg-neutral-700">
              <div className="flex items-center">
                <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                  <HugeiconsIcon icon={Idea01Icon} size={24} strokeWidth={1.5} />
                </div>
                <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">Modo oscuro</p>
              </div>
              <SwitchDarkMode2 />
            </div>

            {/* Ayuda */}
            {/* <Link
              href="/ayuda"
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={CustomerSupportIcon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">Centro de ayuda</p>
            </Link> */}

            {isPlatformAdmin && (
              <Link
                href="/admin"
                className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-neutral-700"
              >
                <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                  <HugeiconsIcon icon={UserIcon} size={24} strokeWidth={1.5} />
                </div>
                <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">
                  Administración
                </p>
              </Link>
            )}

            {/* Cerrar Sesión */}
            <button
              onClick={handleLogout}
              className="-m-3 flex w-full items-center rounded-lg p-2 text-left transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-red-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-red-600 dark:text-red-400">
                <HugeiconsIcon icon={Logout01Icon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium text-red-600 dark:text-red-400">Cerrar sesión</p>
            </button>
          </div>
        </PopoverPanel>
      </Popover>
    </div>
  )
}
