'use client'

import { useTranslations } from 'next-intl'
import type { Comment } from '../../interfaces/comment.interfaces'

interface CommentRepliesSectionProps {
  showReplies: boolean
  hasReplies: boolean
  isReply: boolean
  isLoadingReplies: boolean
  replies: Comment[]
  onReplyDeleted?: (replyId: string) => void
}

export function CommentRepliesSection({
  showReplies,
  hasReplies,
  isReply,
  isLoadingReplies,
  replies,
  onReplyDeleted,
}: CommentRepliesSectionProps) {
  const t = useTranslations('feed')

  return (
    <>
      {/* Lista de respuestas - Solo un nivel, sin anidación */}
      {showReplies && hasReplies && !isReply && !isLoadingReplies && (
        <div className="relative mt-1 ml-10">
          {/* Línea vertical continua */}
          <div className="absolute top-0 bottom-2 left-4 w-0.5 bg-neutral-200 dark:bg-neutral-700" />

          {typeof window !== 'undefined' && replies.length > 0 && <CommentReplyListLazy replies={replies} onReplyDeleted={onReplyDeleted} />}
        </div>
      )}

      {/* Loading de respuestas */}
      {showReplies && isLoadingReplies && (
        <div className="ml-12 flex items-center gap-2 py-4">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-500" />
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('comments.loadingReplies')}</span>
        </div>
      )}
    </>
  )
}

// Lazy import para evitar importación circular
const CommentReplyListLazy = (props: any) => {
  const { CommentReplyList } = require('../CommentReplyList')
  return <CommentReplyList {...props} />
}
