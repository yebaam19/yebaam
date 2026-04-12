'use client'

/**
 * ArticleMobileActions Component
 *
 * Floating action bar for mobile devices with like, comment, bookmark, and share buttons
 * Visible only on small screens
 */

import { BookmarkIcon, ChatBubbleLeftIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'

interface ArticleMobileActionsProps {
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

export function ArticleMobileActions({
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
}: ArticleMobileActionsProps) {
  return (
    <div className="sticky bottom-4 lg:hidden">
      <div className="flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white/90 p-2 shadow-lg backdrop-blur dark:border-neutral-700 dark:bg-neutral-800/90">
        <button
          onClick={onLike}
          disabled={!isLoggedIn || isLoading}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors ${
            isLiked ? 'bg-red-50 text-red-600 dark:bg-red-900/30' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isLiked ? <HeartIconSolid className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
          {likeCount}
        </button>

        <button
          onClick={onComment}
          disabled={!isLoggedIn || isLoading}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-700"
        >
          <ChatBubbleLeftIcon className="h-4 w-4" />
          {commentCount}
        </button>

        <button
          onClick={onBookmark}
          disabled={!isLoggedIn || isLoading}
          className={`rounded-full p-2 transition-colors ${
            isBookmarked
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30'
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isBookmarked ? <BookmarkIconSolid className="h-4 w-4" /> : <BookmarkIcon className="h-4 w-4" />}
        </button>

        <button
          onClick={onShare}
          disabled={isLoading}
          className="rounded-full p-2 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-700"
        >
          <ShareIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
