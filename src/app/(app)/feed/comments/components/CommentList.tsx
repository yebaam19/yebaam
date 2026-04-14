'use client'

import { useEffect } from 'react'
import { useCommentSocket } from '../hooks/useCommentSocket'
import { useCommentStore } from '../store/comment.store'
import { CommentInput } from './CommentInput'
import { CommentItem } from './CommentItem'
import { CommentListSkeleton } from './CommentSkeleton'
import { EmptyComments } from './EmptyComments'

interface CommentListProps {
  postId: string
  showInput?: boolean
  maxHeight?: string
  className?: string
}

/**
 * Lista de comentarios de un post
 * Incluye: Input + Lista + Loading + Empty state
 *
 * @example
 * <CommentList
 *   postId="123"
 *   showInput={true}
 *   maxHeight="400px"
 * />
 */
export function CommentList({ postId, showInput = true, maxHeight, className = '' }: CommentListProps) {
  const { commentsByPost, loadingStates, fetchCommentsByPost } = useCommentStore()

  // Activar Realtime (Supabase) para actualizaciones en vivo de este post
  useCommentSocket(postId)

  // Cargar comentarios al montar
  useEffect(() => {
    fetchCommentsByPost({
      postId,
      sortBy: 'newest',
      limit: 50,
    }).catch((err) => {
      console.warn('[CommentList] fetchCommentsByPost failed', err);
    })
  }, [postId, fetchCommentsByPost])

  const comments = commentsByPost[postId] || []
  const isLoading = loadingStates[postId]?.isLoading || false

  return (
    <div className={`flex flex-col bg-neutral-50 dark:bg-neutral-900/50 ${className}`}>
      {/* Input para crear comentario */}
      {showInput && (
        <div className="border-b border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <CommentInput postId={postId} />
        </div>
      )}

      {/* Lista de comentarios */}
      <div className="overflow-y-auto" style={{ maxHeight: maxHeight || '600px' }}>
        {isLoading ? (
          <CommentListSkeleton count={3} />
        ) : comments.length === 0 ? (
          
          showInput ? <EmptyComments /> : null
        ) : (
          <div className="space-y-0">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>

      {/* Footer con contador */}
      {!isLoading && comments.length > 0 && (
        <div className="bg-neutral-100 px-4 py-2 text-center dark:bg-neutral-800/50">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
          </span>
        </div>
      )}
    </div>
  )
}
