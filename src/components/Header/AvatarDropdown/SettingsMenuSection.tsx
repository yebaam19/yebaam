import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { HugeiconsIcon } from '@hugeicons/react'
import { Settings02Icon, UserIcon } from '@hugeicons/core-free-icons'

interface SettingsMenuSectionProps {
  isPlatformAdmin?: boolean
}

export default function SettingsMenuSection({ isPlatformAdmin }: SettingsMenuSectionProps) {
  const t = useTranslations('avatar')

  return (
    <>
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
          <p className="ms-4 text-sm font-medium text-neutral-900 dark:text-white">{t('administration')}</p>
        </Link>
      )}
    </>
  )
}
