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
    <div className={`rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900 ${className || ''}`}>
      <div className="flex items-center gap-3">
        <Avatar src={user.avatar} className="size-10" initials={initials} />
        <button
          onClick={onCreateClick}
          className="flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-left text-sm text-neutral-500 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
        >
          ¿Qué estás pensando, {firstName}?
        </button>
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <button
          onClick={onCreateClick}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <PhotoIcon className="h-5 w-5 text-green-500" />
          <span>Foto/Video</span>
        </button>
        <button
          onClick={handleFeelingClick}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <FaceSmileIcon className="h-5 w-5 text-yellow-500" />
          <span>Sentimiento/Actividad</span>
        </button>
      </div>
    </div>
  )
}
