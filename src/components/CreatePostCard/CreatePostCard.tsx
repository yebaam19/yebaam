'use client'

import { getFirstName, getUserInitials } from '@/lib/user-helpers'
import Avatar from '@/ui/Avatar'
import { PencilIcon, PhotoIcon, VideoCameraIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import { isFeatureEnabled } from '@/config/features-flag'

interface CreatePostCardProps {
  user: {
    avatar?: string
    username?: string
  }
  onCreateClick: () => void
  onLiveVideoClick?: () => void
  className?: string
}

export default function CreatePostCard({ user, onCreateClick, onLiveVideoClick, className }: CreatePostCardProps) {
  const firstName = getFirstName(user.username)
  const initials = getUserInitials(user.username)

  const handleLiveVideoClick = () => {
    if (onLiveVideoClick) {
      onLiveVideoClick()
    } else {
      onCreateClick()
    }
  }

  return (
    <div className={`rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900 ${className || ''}`}>
      {/* Input de creación */}
      <div className="mb-3 flex items-center gap-3">
        <Avatar src={user.avatar} className="size-10" initials={initials} />
        <button
          onClick={onCreateClick}
          className="flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-left text-sm text-neutral-500 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
        >
          ¿Qué estás pensando, {firstName}?
        </button>
      </div>

      {/* Botones de acción */}
      <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <div className="flex items-center justify-around gap-2">
          <button
            onClick={handleLiveVideoClick}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <VideoCameraIcon className="h-6 w-6 text-red-500" />
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Video en vivo</span>
          </button>
          <button
            onClick={onCreateClick}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <PhotoIcon className="h-6 w-6 text-green-500" />
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Foto/Video</span>
          </button>
          {isFeatureEnabled('ARTICLES_ENABLED') && (
            <Link
              href="/feed/article/new"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <PencilIcon className="h-6 w-6 text-primary-500" />
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Escribir Artículo</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
