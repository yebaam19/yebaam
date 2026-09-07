'use client'

import { getFirstName, getUserInitials, getUserDisplayName } from '@/lib/user-helpers'
import Avatar from '@/ui/Avatar'
import { FaceSmileIcon, PhotoIcon } from '@/components/icons/heroicons-shim'

interface CreatePostCardProps {
  user: {
    avatar?: string
    username?: string
    firstName?: string | null
    lastName?: string | null
  }
  onCreateClick: () => void
  onFeelingClick?: () => void
  className?: string
}

export default function CreatePostCard({
  user,
  onCreateClick,
  onFeelingClick,
  className,
}: CreatePostCardProps) {
  // Greet by the person's real first name (falls back to the @handle only when
  // no name exists) — never the email-derived username when a name is present.
  const displayName = getUserDisplayName(user)
  const firstName = getFirstName(displayName)
  const initials = getUserInitials(displayName)

  const handleFeelingClick = () => {
    if (onFeelingClick) {
      onFeelingClick()
    } else {
      onCreateClick()
    }
  }

  return (
    <div className={`rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(17,24,39,0.05)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none ${className || ''}`}>
      <div className="flex items-center gap-3">
        <Avatar src={user.avatar} className="size-10" initials={initials} />
        <button
          type="button"
          onClick={onCreateClick}
          className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left text-sm text-neutral-500 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-400 dark:hover:border-primary-700 dark:hover:bg-neutral-800"
        >
          ¿Qué estás pensando, {firstName}?
        </button>
      </div>

      <div className="mt-3 flex items-stretch gap-1.5 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <button
          type="button"
          onClick={onCreateClick}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:flex-row sm:gap-2 sm:px-3 sm:text-sm dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <PhotoIcon className="h-5 w-5 shrink-0 text-green-500" />
          <span className="min-w-0 text-center leading-4">Foto/Video</span>
        </button>
        <button
          type="button"
          onClick={handleFeelingClick}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:flex-row sm:gap-2 sm:px-3 sm:text-sm dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <FaceSmileIcon className="h-5 w-5 shrink-0 text-yellow-500" />
          <span className="min-w-0 text-center leading-4">Sentimiento/Actividad</span>
        </button>
      </div>
    </div>
  )
}
