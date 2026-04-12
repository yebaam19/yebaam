'use client'

import type { Comment } from '../interfaces/comment.interfaces'
import { CommentItem } from './CommentItem'

interface CommentReplyListProps {
  replies: Comment[]
  className?: string
}

/**
 * Lista de respuestas a un comentario
 * Muestra todas las respuestas al mismo nivel (sin anidación)
 * El backend no permite replies a replies
 */
export function CommentReplyList({ replies, className = '' }: CommentReplyListProps) {
  if (!replies || replies.length === 0) {
    return null
  }

  return (
    <div className={`${className}`}>
      {replies.map((reply) => (
        <div key={reply.id} className="relative">
          {/* Línea horizontal de conexión */}
          <div className="absolute top-5 left-4 h-0.5 w-4 bg-neutral-200 dark:bg-neutral-700" />

          {/* Reply con padding izquierdo */}
          <div className="pl-8">
            <CommentItem comment={reply} isReply={true} />
          </div>
        </div>
      ))}
    </div>
  )
}
