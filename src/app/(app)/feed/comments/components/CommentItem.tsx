'use client'

import { useAuth } from '@/features/auth'
import { useSocket } from '@/providers/socket-provider'
import { ChatBubbleLeftIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useState } from 'react'
import type { Comment, CommentUpdatedPayload } from '../interfaces/comment.interfaces'
import { commentService } from '../services/comment.service'
import { useCommentStore } from '../store/comment.store'
import { CommentActions } from './CommentActions'
import { CommentContent } from './CommentContent'
import { CommentHeader } from './CommentHeader'

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
export function CommentItem({ comment, isReply = false, onReplyCreated, className = '' }: CommentItemProps) {
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
  const canReply = !isReply && user
  const hasReplies = localRepliesCount > 0

  // Sincronizar con prop cuando cambia (para comentarios del store)
  useEffect(() => {
    setLocalComment(comment)
  }, [comment])

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
    if (!confirm('¿Estás seguro de eliminar este comentario?')) {
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
                  author={localComment.author}
                  createdAt={localComment.createdAt}
                  isEdited={localComment.isEdited}
                  editedAt={localComment.editedAt}
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
                      content={localComment.content}
                      commentId={localComment.id}
                      isEditing={isEditing}
                      onEdit={handleEdit}
                      onCancelEdit={() => setIsEditing(false)}
                    />
                  </div>

                  {/* Acciones del comentario */}
                  <div className="mt-1.5 ml-1 flex items-center gap-4">
                    {/* Botón Responder */}
                    {canReply && user && !isEditing && (
                      <button
                        onClick={() => setShowReplyInput(!showReplyInput)}
                        className={`flex items-center gap-1.5 text-xs font-semibold ${
                          showReplyInput
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400'
                        } transition-colors`}
                      >
                        <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
                        Responder
                      </button>
                    )}

                    {/* Mostrar/Ocultar respuestas */}
                    {hasReplies && !isReply && (
                      <button
                        onClick={handleToggleReplies}
                        className="flex items-center gap-1 text-xs font-semibold text-neutral-500 transition-colors hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
                      >
                        {isLoadingReplies ? (
                          <span className="flex items-center gap-1">
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-500" />
                            Cargando...
                          </span>
                        ) : (
                          <>
                            {showReplies ? (
                              <ChevronUpIcon className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDownIcon className="h-3.5 w-3.5" />
                            )}
                            {showReplies ? 'Ocultar' : 'Ver'} {localRepliesCount}{' '}
                            {localRepliesCount === 1 ? 'respuesta' : 'respuestas'}
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
                  <CommentActions onEdit={() => setIsEditing(true)} onDelete={handleDelete} isDeleting={isDeleting} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input para responder - Solo para comentarios raíz */}
      {showReplyInput && canReply && (
        <div className="bg-white pr-4 pb-3 pl-14 dark:bg-neutral-900">
          {typeof window !== 'undefined' && (
            <CommentReplyInputLazy
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
        </div>
      )}

      {/* Lista de respuestas - Solo un nivel, sin anidación */}
      {showReplies && hasReplies && !isReply && !isLoadingReplies && (
        <div className="relative mt-1 ml-10">
          {/* Línea vertical continua */}
          <div className="absolute top-0 bottom-2 left-4 w-0.5 bg-neutral-200 dark:bg-neutral-700" />

          {typeof window !== 'undefined' && replies.length > 0 && <CommentReplyListLazy replies={replies} />}
        </div>
      )}

      {/* Loading de respuestas */}
      {showReplies && isLoadingReplies && (
        <div className="ml-12 flex items-center gap-2 py-4">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-500" />
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Cargando respuestas...</span>
        </div>
      )}
    </div>
  )
}

// Lazy imports para evitar importación circular
const CommentReplyInputLazy = (props: any) => {
  const { CommentReplyInput } = require('./CommentReplyInput')
  return <CommentReplyInput {...props} />
}

const CommentReplyListLazy = (props: any) => {
  const { CommentReplyList } = require('./CommentReplyList')
  return <CommentReplyList {...props} />
}
