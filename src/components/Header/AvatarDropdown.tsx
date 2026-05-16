'use client'

import { useAuth } from '@/features/auth/context/auth-context'
import Avatar from '@/ui/Avatar'
import { Divider } from '@/ui/divider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import {
  Logout01Icon,
  Settings02Icon,
  ShieldUserIcon,
  UserIcon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { supabase } from '@/utils/supabase/client'
import VerifyProfileDialog from '@/features/verification/components/VerifyProfileDialog'

interface Props {
  className?: string
  isPlatformAdmin?: boolean
}

export default function AvatarDropdown({ className, isPlatformAdmin }: Props) {
  const t = useTranslations('avatar')
  const { user, logout } = useAuth()
  const router = useRouter()
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [uniqueIdCode, setUniqueIdCode] = useState<string | null>(null)
  const [pioneerNumber, setPioneerNumber] = useState<number | null>(null)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('is_verified, unique_id_code, pioneer_number')
      .eq('id', user.id)
      .maybeSingle()
      .then(
        ({
          data,
        }: {
          data: { is_verified: boolean | null; unique_id_code: string | null; pioneer_number: number | null } | null
        }) => {
          if (cancelled) return
          setIsVerified(data?.is_verified ?? false)
          setUniqueIdCode(data?.unique_id_code ?? null)
          setPioneerNumber(data?.pioneer_number ?? null)
        },
      )
    return () => {
      cancelled = true
    }
  }, [user?.id])

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
        {({ close }) => (
        <>
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
              <div className="relative shrink-0">
                <Avatar className="size-12" src={userAvatar} initials={displayName?.slice(0, 2).toUpperCase()} />
                {isVerified && (
                  <span
                    aria-label="Cuenta autenticada"
                    title="Cuenta autenticada"
                    className="absolute -right-0.5 -bottom-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-white dark:ring-neutral-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.005l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.795-6.889a1 1 0 0 1 1.415-.006Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>

              <div className="grow">
                <h4 className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
                  <span>{displayName}</span>
                  {isVerified && (
                    <span
                      aria-label="Cuenta autenticada"
                      title="Cuenta autenticada"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3 w-3"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.005l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.795-6.889a1 1 0 0 1 1.415-.006Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </h4>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">@{user.username}</p>
                {pioneerNumber != null && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-950 ring-1 ring-amber-300/60">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-2.5 w-2.5"
                      aria-hidden="true"
                    >
                      <path d="M12 2.75 14.39 8 20 8.81l-4 3.92.94 5.49L12 15.77l-4.94 2.45L8 12.73l-4-3.92L9.61 8 12 2.75Z" />
                    </svg>
                    {t('pioneerNumber', { n: pioneerNumber })}
                  </span>
                )}
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
              <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">{t('viewProfile')}</p>
            </Link>

            {/* Mis Amigos */}
            <Link
              href="/feed/friends"
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={UserMultiple02Icon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">{t('friends')}</p>
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

            {/* Autenticar perfil — opens the same VerifyProfileDialog as the profile-page banner.
                Close the popover BEFORE opening the dialog, otherwise the popover's
                backdrop and focus trap fight the dialog's and freeze the page. */}
            {!isVerified && (
              <button
                type="button"
                onClick={() => {
                  close()
                  setVerifyOpen(true)
                }}
                className="-m-3 flex w-full items-center rounded-lg p-2 text-left transition duration-150 ease-in-out hover:bg-yellow-50 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-yellow-900/20"
              >
                <div className="flex shrink-0 items-center justify-center text-yellow-600 dark:text-yellow-400">
                  <HugeiconsIcon icon={ShieldUserIcon} size={24} strokeWidth={1.5} />
                </div>
                <p className="ms-4 text-sm font-medium text-yellow-800 dark:text-yellow-300">{t('verifyAccount')}</p>
              </button>
            )}

            {/* Mi identificación — permanent access to the verification certificate
                once the user is approved. This is what replaces the dismissable
                green banner on the profile. */}
            {isVerified && uniqueIdCode && (
              <Link
                href={`/verification/certificate/${uniqueIdCode}`}
                target="_blank"
                onClick={() => close()}
                className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-emerald-50 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-emerald-900/20"
              >
                <div className="flex shrink-0 items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <HugeiconsIcon icon={ShieldUserIcon} size={24} strokeWidth={1.5} />
                </div>
                <div className="ms-4">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{t('myIdentification')}</p>
                  <p className="font-mono text-[10px] text-emerald-700/70 dark:text-emerald-400/70">{uniqueIdCode}</p>
                </div>
              </Link>
            )}

            <Divider />

            <Link
              href="/ajustes"
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={Settings02Icon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">{t('settings')}</p>
            </Link>

            {isPlatformAdmin && (
              <Link
                href="/admin"
                className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-neutral-700"
              >
                <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                  <HugeiconsIcon icon={UserIcon} size={24} strokeWidth={1.5} />
                </div>
                <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">
                  {t('administration')}
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
              <p className="ms-4 text-sm font-medium text-red-600 dark:text-red-400">{t('logout')}</p>
            </button>
          </div>
        </PopoverPanel>
        </>
        )}
      </Popover>

      {user.id && (
        <VerifyProfileDialog
          open={verifyOpen}
          onClose={() => setVerifyOpen(false)}
          ownerUserId={user.id}
        />
      )}
    </div>
  )
}
