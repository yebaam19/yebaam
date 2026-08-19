'use client'

import { useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useCommentSocket } from '../hooks/useCommentSocket'
import { useCommentStore } from '../store/comment.store'
import { useReactionStore } from '@/app/(app)/feed/reacions/store/reaction.store'
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
  const t = useTranslations('feed')
  const { commentsByPost, loadingStates, fetchCommentsByPost } = useCommentStore()

  useCommentSocket(postId)

  // Skip the round-trip when a previous mount already cached the thread —
  // toggling the comments section open/closed must not re-query.
  useEffect(() => {
    if (commentsByPost[postId]) return
    void fetchCommentsByPost({
      postId,
      sortBy: 'newest',
      limit: 50,
    })
  }, [postId, fetchCommentsByPost, commentsByPost])

  // Solo raíces: el store ya no mete respuestas aquí, pero un `parentId`
  // colado (p. ej. de una versión vieja en caché) no debe renderizarse como
  // comentario de primer nivel.
  const comments = useMemo(
    () => (commentsByPost[postId] || []).filter((c) => !c.parentId),
    [commentsByPost, postId],
  )
  const isLoading = loadingStates[postId]?.isLoading || false

  // Una sola petición de reacciones para todo el hilo. Antes cada `CommentItem`
  // pedía las suyas por separado, así que un hilo de 50 comentarios disparaba
  // ~100 queries a `reactions` al abrirse.
  const visibleCommentIds = comments.length > 0 ? comments.map((c) => c.id).join(',') : ''
  useEffect(() => {
    if (!visibleCommentIds) return
    const ids = visibleCommentIds.split(',')
    const { fetchMyReactionsForComments, fetchCountsForComments } = useReactionStore.getState()
    void fetchMyReactionsForComments(ids)
    void fetchCountsForComments(ids)
  }, [visibleCommentIds])

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
            {t('comments.count', { count: comments.length })}
          </span>
        </div>
      )}
    </div>
  )
}
