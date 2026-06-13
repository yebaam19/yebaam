import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { HugeiconsIcon } from '@hugeicons/react'
import { MedalIcon, ShieldUserIcon, UserIcon, UserMultiple02Icon } from '@hugeicons/core-free-icons'

interface ProfileMenuSectionProps {
  username: string
  isVerified: boolean | null
  uniqueIdCode: string | null
  onClose: () => void
  onVerifyClick: () => void
}

export default function ProfileMenuSection({
  username,
  isVerified,
  uniqueIdCode,
  onClose,
  onVerifyClick,
}: ProfileMenuSectionProps) {
  const t = useTranslations('avatar')

  return (
    <>
      {/* Mi Perfil */}
      <Link
        href={`/${username}`}
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

      {/* Reconocimientos — catálogo público de insignias y badges. */}
      <Link
        href="/insignias"
        className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-neutral-700"
      >
        <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
          <HugeiconsIcon icon={MedalIcon} size={24} strokeWidth={1.5} />
        </div>
        <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">{t('recognitions')}</p>
      </Link>

      {/* Mis Fotos */}
      {/* <Link
        href={`/${username}/fotos`}
        className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-primary-500/50 dark:hover:bg-neutral-700"
      >
        <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
          <HugeiconsIcon icon={Image02Icon} size={24} strokeWidth={1.5} />
        </div>
        <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">Fotos</p>
      </Link> */}

      {/* Mis Videos */}
      {/* <Link
        href={`/${username}/videos`}
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
            onClose()
            onVerifyClick()
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
          onClick={() => onClose()}
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
    </>
  )
}
