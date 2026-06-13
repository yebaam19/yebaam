import { useTranslations } from 'next-intl'
import { HugeiconsIcon } from '@hugeicons/react'
import { Logout01Icon } from '@hugeicons/core-free-icons'

interface LogoutMenuItemProps {
  onLogout: () => void
}

export default function LogoutMenuItem({ onLogout }: LogoutMenuItemProps) {
  const t = useTranslations('avatar')

  return (
    <button
      onClick={onLogout}
      className="-m-3 flex w-full items-center rounded-lg p-2 text-left transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-red-500/50 dark:hover:bg-neutral-700"
    >
      <div className="flex shrink-0 items-center justify-center text-red-600 dark:text-red-400">
        <HugeiconsIcon icon={Logout01Icon} size={24} strokeWidth={1.5} />
      </div>
      <p className="ms-4 text-sm font-medium text-red-600 dark:text-red-400">{t('logout')}</p>
    </button>
  )
}
