'use client'

import type { ForoPost } from '@/features/foro/types'
import PostItem from './ReplyList/PostItem'
import { type UserCardStrings } from './ReplyList/UserCard'

interface Props {
  posts: ForoPost[]
  topicHref: string
  isLocked: boolean
  isModerator: boolean
  /** Current viewer id (null when signed out), used to compute owner rights. */
  currentUserId: string | null | undefined
  editingPostId: string | null
  userCardStrings: UserCardStrings
  onStartEdit: (post: ForoPost) => void
  onCancelEdit: () => void
  onDeletePost: (postId: string) => void
  onQuote: (post: ForoPost) => void
  onSaveEdit: (postId: string, content: string) => Promise<{ ok: boolean; error?: string | null }>
}

// The ordered list of posts/replies. Computes per-row permissions and delegates
// each row to the memoized PostItem; all server-action calls stay in the parent.
export default function ReplyList({
  posts,
  topicHref,
  isLocked,
  isModerator,
  currentUserId,
  editingPostId,
  userCardStrings,
  onStartEdit,
  onCancelEdit,
  onDeletePost,
  onQuote,
  onSaveEdit,
}: Props) {
  const hasUser = Boolean(currentUserId)
  return (
    <ol className="space-y-3">
      {posts.map((post) => {
        const isOwner = currentUserId === post.author.id
        const canDelete = isModerator || isOwner
        const canEdit = isModerator || isOwner
        return (
          <PostItem
            key={post.id}
            post={post}
            topicHref={topicHref}
            isLocked={isLocked}
            hasUser={hasUser}
            canEdit={canEdit}
            canDelete={canDelete}
            isEditing={editingPostId === post.id}
            userCardStrings={userCardStrings}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onDeletePost={onDeletePost}
            onQuote={onQuote}
            onSaveEdit={onSaveEdit}
          />
        )
      })}
    </ol>
  )
}
