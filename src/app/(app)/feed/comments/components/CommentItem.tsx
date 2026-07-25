'use client'

import { useAuth } from '@/features/auth'
import { useSocket } from '@/providers/socket-provider'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import type { Comment, CommentUpdatedPayload } from '../interfaces/comment.interfaces'
import { commentService } from '../services/comment.service'
import { useCommentStore } from '../store/comment.store'
import { CommentBody } from './CommentItem/CommentBody'
import { CommentReplyComposer } from './CommentItem/CommentReplyComposer'
import { CommentRepliesSection } from './CommentItem/CommentRepliesSection'
import { useReactionStore } from '@/app/(app)/feed/reacions/store/reaction.store'

interface CommentItemProps {
  comment: Comment
  isReply?: boolean
  onReplyCreated?: () => void // Callback para notificar al padre cuando se crea un reply
  className?: string
}

/**
 * Item individual de comentario
 * Combina: Header + Content + Actions + Respuestas
 * Solo los comentarios raíz pueden tener respuestas (no hay replies anidados)
 */
export function CommentItem({ comment, isReply = false, className = '' }: CommentItemProps) {
  const t = useTranslations('feed')
  const { user } = useAuth()
  const { postsSocket } = useSocket()
  const { updateComment, deleteComment } = useCommentStore()

  // Estado local del comentario para actualizaciones en tiempo real
  const [localComment, setLocalComment] = useState<Comment>(comment)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<Comment[]>([])
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)
  const [localRepliesCount, setLocalRepliesCount] = useState(comment.repliesCount || 0)

  const isAuthor = user?.id === localComment.author.id
  // Solo los comentarios raíz (no replies) pueden recibir respuestas
  const canReply = !isReply && !!user
  const hasReplies = localRepliesCount > 0

  // Sincronizar con prop cuando cambia (para comentarios del store)
  useEffect(() => {
    setLocalComment(comment)
  }, [comment])

  // Las reacciones de ESTE comentario las pide `CommentList` en un solo lote
  // para todo el hilo (antes cada fila disparaba 2 queries: 50 comentarios =
  // 100 peticiones). Aquí solo cubrimos las replies, que se cargan aparte y
  // bajo demanda — también en lote.
  const replyIds = replies.length > 0 ? replies.map((r) => r.id).join(',') : ''
  useEffect(() => {
    if (!replyIds) return
    const ids = replyIds.split(',')
    const { fetchMyReactionsForComments, fetchCountsForComments } = useReactionStore.getState()
    void fetchMyReactionsForComments(ids)
    void fetchCountsForComments(ids)
  }, [replyIds])

  // Escuchar actualizaciones en tiempo real de este comentario y sus replies
  useEffect(() => {
    if (!postsSocket) return

    const handleCommentUpdated = (payload: CommentUpdatedPayload) => {
      const { comment: updatedComment } = payload

      // Si es este comentario, actualizar estado local
      if (updatedComment.id === localComment.id) {
        setLocalComment(updatedComment)
      }

      // Si es una de las replies, actualizar en la lista de replies
      setReplies((prevReplies) => prevReplies.map((reply) => (reply.id === updatedComment.id ? updatedComment : reply)))
    }

    postsSocket.on('comment_updated', handleCommentUpdated)

    return () => {
      postsSocket.off('comment_updated', handleCommentUpdated)
    }
  }, [postsSocket, localComment.id])

  // Cargar respuestas cuando se expanden
  useEffect(() => {
    if (showReplies && hasReplies && replies.length === 0) {
      loadReplies()
    }
  }, [showReplies, hasReplies])

  const loadReplies = useCallback(async () => {
    setIsLoadingReplies(true)
    try {
      const loadedReplies = await commentService.getReplies(comment.postId, comment.id)
      setReplies(loadedReplies)
    } catch (error) {
      console.error('Error al cargar respuestas:', error)
    } finally {
      setIsLoadingReplies(false)
    }
  }, [comment.postId, comment.id])

  const handleToggleReplies = () => {
    setShowReplies(!showReplies)
  }

  const handleReplyCreated = useCallback(async () => {
    // Incrementar contador local
    setLocalRepliesCount((prev) => prev + 1)
    // Recargar las respuestas para mostrar la nueva
    setShowReplies(true)
    await loadReplies()
  }, [loadReplies])

  const handleEdit = async (newContent: string) => {
    try {
      const updatedComment = await updateComment({
        commentId: localComment.id,
        postId: localComment.postId,
        content: newContent,
      })
      // Actualizar estado local inmediatamente
      setLocalComment(updatedComment)
      setIsEditing(false)
    } catch (error) {
      console.error('Error al editar:', error)
      throw error
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('comments.deleteConfirm'))) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteComment({
        commentId: localComment.id,
        postId: localComment.postId,
      })
    } catch (error) {
      console.error('Error al eliminar:', error)
      setIsDeleting(false)
    }
  }

  return (
    <div className={` ${isDeleting ? 'pointer-events-none opacity-50' : ''} ${className} `}>
      {/* Comentario principal */}
      <CommentBody
        comment={localComment}
        isReply={isReply}
        isAuthor={isAuthor}
        isEditing={isEditing}
        isDeleting={isDeleting}
        canReply={canReply}
        showReplyInput={showReplyInput}
        hasReplies={hasReplies}
        showReplies={showReplies}
        isLoadingReplies={isLoadingReplies}
        repliesCount={localRepliesCount}
        onToggleReplyInput={() => setShowReplyInput(!showReplyInput)}
        onToggleReplies={handleToggleReplies}
        onEdit={handleEdit}
        onCancelEdit={() => setIsEditing(false)}
        onStartEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
      />

      {/* Input para responder - Solo para comentarios raíz */}
      {showReplyInput && canReply && (
        <CommentReplyComposer
          postId={localComment.postId}
          parentCommentId={localComment.id}
          replyingTo={{
            username: localComment.author.username,
            fullName: `${localComment.author.firstName} ${localComment.author.lastName}`,
          }}
          onCancel={() => setShowReplyInput(false)}
          onReplyCreated={() => {
            setShowReplyInput(false)
            handleReplyCreated()
          }}
        />
      )}

      {/* Lista de respuestas - Solo un nivel, sin anidación */}
      <CommentRepliesSection
        showReplies={showReplies}
        hasReplies={hasReplies}
        isReply={isReply}
        isLoadingReplies={isLoadingReplies}
        replies={replies}
      />
    </div>
  )
}
