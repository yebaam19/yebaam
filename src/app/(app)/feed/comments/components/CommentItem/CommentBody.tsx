'use client'

import { ChatBubbleLeftIcon, ChevronDownIcon, ChevronUpIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'
import type { Comment } from '../../interfaces/comment.interfaces'
import { CommentActions } from '../CommentActions'
import { CommentContent } from '../CommentContent'
import { CommentHeader } from '../CommentHeader'
import { CommentReactionButton } from '@/app/(app)/feed/reacions/components/CommentReactionButton'

interface CommentBodyProps {
  comment: Comment
  isReply: boolean
  isAuthor: boolean
  isEditing: boolean
  isDeleting: boolean
  canReply: boolean | '' | null | undefined
  showReplyInput: boolean
  hasReplies: boolean
  showReplies: boolean
  isLoadingReplies: boolean
  repliesCount: number
  onToggleReplyInput: () => void
  onToggleReplies: () => void
  onEdit: (newContent: string) => Promise<void>
  onCancelEdit: () => void
  onStartEdit: () => void
  onDelete: () => void
}

export function CommentBody({
  comment,
  isReply,
  isAuthor,
  isEditing,
  isDeleting,
  canReply,
  showReplyInput,
  hasReplies,
  showReplies,
  isLoadingReplies,
  repliesCount,
  onToggleReplyInput,
  onToggleReplies,
  onEdit,
  onCancelEdit,
  onStartEdit,
  onDelete,
}: CommentBodyProps) {
  const t = useTranslations('feed')

  return (
    <div
      className={`group relative ${
        isReply ? 'px-3 py-3' : 'border-b border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
      } transition-colors ${!isReply && 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'} `}
    >
      <div className="flex items-start gap-3">
        {/* Avatar y contenido */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CommentHeader
                author={comment.author}
                createdAt={comment.createdAt}
                isEdited={comment.isEdited}
                editedAt={comment.editedAt}
                isReply={isReply}
              />

              {/* Contenido del comentario en burbuja */}
              <div className="mt-1 ml-10">
                <div
                  className={`inline-block rounded-2xl px-4 py-2 ${
                    isReply ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-neutral-100 dark:bg-neutral-800'
                  } `}
                >
                  <CommentContent
                    content={comment.content}
                    commentId={comment.id}
                    isEditing={isEditing}
                    onEdit={onEdit}
                    onCancelEdit={onCancelEdit}
                  />
                </div>

                {/* Acciones del comentario */}
                <div className="mt-1.5 ml-1 flex items-center gap-4">
                  {/* Reacción */}
                  {!isEditing && <CommentReactionButton commentId={comment.id} />}

                  {/* Botón Responder */}
                  {canReply && !isEditing && (
                    <button
                      onClick={onToggleReplyInput}
                      className={`flex items-center gap-1.5 text-xs font-semibold ${
                        showReplyInput
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400'
                      } transition-colors`}
                    >
                      <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
                      {t('comments.reply')}
                    </button>
                  )}

                  {/* Mostrar/Ocultar respuestas */}
                  {hasReplies && !isReply && (
                    <button
                      onClick={onToggleReplies}
                      className="flex items-center gap-1 text-xs font-semibold text-neutral-500 transition-colors hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
                    >
                      {isLoadingReplies ? (
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-500" />
                          {t('comments.loading')}
                        </span>
                      ) : (
                        <>
                          {showReplies ? (
                            <ChevronUpIcon className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDownIcon className="h-3.5 w-3.5" />
                          )}
                          {showReplies
                            ? t('comments.hideReplies', { count: repliesCount })
                            : t('comments.showReplies', { count: repliesCount })}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones solo para el autor */}
            {isAuthor && !isEditing && (
              <div className="opacity-0 transition-opacity group-hover:opacity-100">
                <CommentActions onEdit={onStartEdit} onDelete={onDelete} isDeleting={isDeleting} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
