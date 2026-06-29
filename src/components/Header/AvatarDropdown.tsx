'use client'

import { useAuth } from '@/features/auth/context/auth-context'
import Avatar from '@/ui/Avatar'
import { Divider } from '@/ui/divider'
import { useEffect, useState } from 'react'

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { supabase } from '@/utils/supabase/client'
import { getUserDisplayName } from '@/lib/user-helpers'
import VerifyProfileDialog from '@/features/verification/components/VerifyProfileDialog'
import UserInfoHeader from './AvatarDropdown/UserInfoHeader'
import ProfileMenuSection from './AvatarDropdown/ProfileMenuSection'
import SettingsMenuSection from './AvatarDropdown/SettingsMenuSection'
import LogoutMenuItem from './AvatarDropdown/LogoutMenuItem'

interface Props {
  className?: string
  isPlatformAdmin?: boolean
}

export default function AvatarDropdown({ className, isPlatformAdmin }: Props) {
  const { user, logout } = useAuth()
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

  // Show the person's real name (first … last), not the email-derived username.
  const displayName = getUserDisplayName(user)
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
                <UserInfoHeader
                  username={user.username}
                  displayName={displayName}
                  userAvatar={userAvatar}
                  isVerified={isVerified}
                  pioneerNumber={pioneerNumber}
                />

                <Divider />

                <ProfileMenuSection
                  username={user.username}
                  isVerified={isVerified}
                  uniqueIdCode={uniqueIdCode}
                  onClose={close}
                  onVerifyClick={() => setVerifyOpen(true)}
                />

                <Divider />

                <SettingsMenuSection isPlatformAdmin={isPlatformAdmin} />

                {/* Cerrar Sesión */}
                <LogoutMenuItem onLogout={handleLogout} />
              </div>
            </PopoverPanel>
          </>
        )}
      </Popover>

      {user.id && (
        <VerifyProfileDialog open={verifyOpen} onClose={() => setVerifyOpen(false)} ownerUserId={user.id} />
      )}
    </div>
  )
}
