'use client'

import { ChatBubbleLeftIcon, ShareIcon } from '@/components/icons/heroicons-shim'
import { ReactionButton, ReactionStats } from '@/app/(app)/feed/reacions'
import type { Post } from '../../interfaces/post.interfaces'

interface Props {
  post: Post
  onShowReactions: () => void
  onToggleComments: () => void
  onShare: () => void
}

const ACTION_CLASS =
  'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'

export function PostCardFooter({ post, onShowReactions, onToggleComments, onShare }: Props) {
  return (
    <>
      <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5 dark:border-neutral-800">
        <ReactionStats reactionsCount={post.reactionsCount} onShowReactions={onShowReactions} />
      </div>

      <div className="border-t border-neutral-200 px-2 py-1 dark:border-neutral-800">
        <div className="flex items-center justify-around">
          <ReactionButton postId={post.id} />
          <button onClick={onToggleComments} className={ACTION_CLASS}>
            <ChatBubbleLeftIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Comentar</span>
          </button>
          <button onClick={onShare} className={ACTION_CLASS}>
            <ShareIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Compartir</span>
          </button>
        </div>
      </div>
    </>
  )
}
