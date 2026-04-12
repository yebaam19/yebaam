'use client'

/**
 * ArticleSidebarActions Component
 *
 * Sticky sidebar with action buttons for likes, comments, bookmarks, and sharing
 * Visible only on large screens
 */

import { BookmarkIcon, ChatBubbleLeftIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'

interface ArticleSidebarActionsProps {
  isLiked: boolean
  likeCount: number
  commentCount: number
  isBookmarked: boolean
  isLoading: boolean
  isLoggedIn: boolean
  onLike: () => void
  onBookmark: () => void
  onShare: () => void
  onComment: () => void
}

export function ArticleSidebarActions({
  isLiked,
  likeCount,
  commentCount,
  isBookmarked,
  isLoading,
  isLoggedIn,
  onLike,
  onBookmark,
  onShare,
  onComment,
}: ArticleSidebarActionsProps) {
  return (
    <div className="sticky top-24 hidden w-16 shrink-0 self-start lg:block">
      <div className="flex flex-col gap-4">
        <button
          onClick={onLike}
          disabled={!isLoggedIn || isLoading}
          className={`flex h-12 w-12 flex-col items-center justify-center rounded-full border transition-colors ${
            isLiked
              ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/30'
              : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isLiked ? <HeartIconSolid className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
          <span className="mt-1 text-xs">{likeCount}</span>
        </button>

        <button
          onClick={onComment}
          disabled={!isLoggedIn || isLoading}
          className="flex h-12 w-12 flex-col items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          <ChatBubbleLeftIcon className="h-5 w-5" />
          <span className="mt-1 text-xs">{commentCount}</span>
        </button>

        <button
          onClick={onBookmark}
          disabled={!isLoggedIn || isLoading}
          className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
            isBookmarked
              ? 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-900/30'
              : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isBookmarked ? <BookmarkIconSolid className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
        </button>

        <button
          onClick={onShare}
          disabled={isLoading}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          <ShareIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
