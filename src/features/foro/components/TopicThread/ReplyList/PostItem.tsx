'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import type { ForoPost } from '@/features/foro/types'
import { formatRelativeDate } from '@/features/foro/utils/format'
import PostContent from '../../PostContent'
import PostEditForm from './PostEditForm'
import UserCard, { type UserCardStrings } from './UserCard'

export interface PostItemProps {
  post: ForoPost
  topicHref: string
  isLocked: boolean
  /** Whether the current viewer is signed in (gates the quote action). */
  hasUser: boolean
  canEdit: boolean
  canDelete: boolean
  /** True when this row is the active edit target (state owned by the parent). */
  isEditing: boolean
  userCardStrings: UserCardStrings
  onStartEdit: (post: ForoPost) => void
  onCancelEdit: () => void
  onDeletePost: (postId: string) => void
  onQuote: (post: ForoPost) => void
  /**
   * Persist an edit. Returns the action result so the row can surface an inline
   * error and decide whether to close the editor. The server-action call itself
   * lives in the parent shell.
   */
  onSaveEdit: (postId: string, content: string) => Promise<{ ok: boolean; error?: string | null }>
}

// One post/reply row: author sidebar + meta header + content (or inline edit
// form). The inline edit form (PostEditForm) is mounted only while editing and
// owns its own draft/error state, so typing re-renders only that small form —
// not this row or the whole list. The row is memoized for the same reason.
function PostItem({
  post,
  topicHref,
  isLocked,
  hasUser,
  canEdit,
  canDelete,
  isEditing,
  userCardStrings,
  onStartEdit,
  onCancelEdit,
  onDeletePost,
  onQuote,
  onSaveEdit,
}: PostItemProps) {
  const t = useTranslations('foro')
  const isOp = post.postNumber === 1

  return (
    <li
      id={`p${post.id}`}
      className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-colors target:border-primary-500 sm:flex dark:border-neutral-800 dark:bg-neutral-900"
    >
      <UserCard
        author={post.author}
        meta={post.authorMeta}
        isOp={isOp}
        strings={userCardStrings}
      />
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-2 dark:border-neutral-800">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            <a
              href={`#p${post.id}`}
              className="font-semibold text-primary-700 hover:underline dark:text-primary-400"
            >
              #{post.postNumber}
            </a>
            {' · '}
            {formatRelativeDate(post.createdAt)}
            {post.editedAt && (
              <span className="ml-1 text-neutral-400 italic">{t('thread.edited')}</span>
            )}
          </div>
          {!isEditing && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {!isLocked && hasUser && (
                <button
                  type="button"
                  onClick={() => onQuote(post)}
                  className="text-primary-700 hover:underline dark:text-primary-400"
                >
                  {t('thread.actions.quote')}
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onStartEdit(post)}
                  className="text-primary-700 hover:underline dark:text-primary-400"
                >
                  {t('thread.actions.edit')}
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDeletePost(post.id)}
                  className="text-red-600 hover:underline"
                >
                  {t('thread.actions.delete')}
                </button>
              )}
            </div>
          )}
        </div>
        {isEditing ? (
          <PostEditForm
            postId={post.id}
            initialContent={post.content}
            onCancel={onCancelEdit}
            onSave={onSaveEdit}
          />
        ) : (
          <div className="mt-3">
            <PostContent content={post.content} topicHref={topicHref} />
          </div>
        )}
        {post.authorMeta?.signature && !isEditing && (
          <div className="mt-4 border-t border-dashed border-neutral-200 pt-2 text-[11px] whitespace-pre-wrap text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            {post.authorMeta.signature}
          </div>
        )}
      </div>
    </li>
  )
}

export default memo(PostItem)
