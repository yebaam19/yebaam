'use client'

import { useAuth } from '@/features/auth'
import { useSocket } from '@/providers/socket-provider'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  onDeleted?: (commentId: string) => void // Para replies: avisa al padre que se borró
  className?: string
}

/**
 * Item individual de comentario
 * Combina: Header + Content + Actions + Respuestas
 * Solo los comentarios raíz pueden tener respuestas (no hay replies anidados)
 */
export function CommentItem({ comment, isReply = false, onDeleted, className = '' }: CommentItemProps) {
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

  // El store es la fuente del contador de respuestas: `createComment` y el
  // INSERT de realtime suben `repliesCount` en el padre (con dedupe), así que
  // aquí solo se refleja — no se suma localmente.
  useEffect(() => {
    setLocalRepliesCount(comment.repliesCount || 0)
  }, [comment.repliesCount])

  // Respuestas que el store colgó del padre (`comment.replies`): las nuevas se
  // mezclan solo si la lista ya está cargada (si no, `loadReplies` las trae de
  // la DB); las que el store quitó (DELETE de realtime) se sacan de la lista.
  const storeReplyIdsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    const incoming = comment.replies ?? []
    const incomingIds = new Set(incoming.map((r) => r.id))
    const removedIds = [...storeReplyIdsRef.current].filter((id) => !incomingIds.has(id))
    storeReplyIdsRef.current = incomingIds
    if (incoming.length === 0 && removedIds.length === 0) return
    setReplies((prev) => {
      let next = removedIds.length > 0 ? prev.filter((r) => !removedIds.includes(r.id)) : prev
      if (next.length > 0) {
        const known = new Set(next.map((r) => r.id))
        const fresh = incoming.filter((r) => !known.has(r.id))
        if (fresh.length > 0) next = [...next, ...fresh]
      }
      return next
    })
  }, [comment.replies])

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

  const handleReplyDeleted = useCallback((replyId: string) => {
    setReplies((prev) => prev.filter((r) => r.id !== replyId))
  }, [])

  const handleReplyCreated = useCallback(async () => {
    // El contador ya lo subió el store en `createComment`; aquí solo se
    // recargan las respuestas para mostrar la nueva
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
        parentId: localComment.parentId ?? null,
      })
      onDeleted?.(localComment.id)
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
        onReplyDeleted={handleReplyDeleted}
      />
    </div>
  )
}
