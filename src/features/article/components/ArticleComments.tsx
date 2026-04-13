'use client'

/**
 * ArticleComments Component
 *
 * Displays and manages comments for an article
 */

import Avatar from '@/ui/Avatar'
import { Button } from '@/ui/Button'
import { PaperAirplaneIcon } from '@/components/icons/heroicons-shim'
import { useEffect, useState } from 'react'
import { ArticleComment } from '../interfaces'
import { articleService } from '../services'
import { formatRelativeDate } from '../utils/date-utils'

interface ArticleCommentsProps {
  articleId: string
  currentUserId: string
}

export function ArticleComments({ articleId, currentUserId }: ArticleCommentsProps) {
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadComments = async () => {
      setIsLoading(true)
      try {
        const loadedComments = await articleService.getCommentsByArticle(articleId)
        setComments(loadedComments)
      } catch (error) {
        console.error('Error loading comments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadComments()
  }, [articleId])

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const result = await articleService.addComment(articleId, currentUserId, newComment.trim())

      if (result.success && result.comment) {
        setComments((prev) => [...prev, result.comment!])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex animate-pulse gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-16 rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* New Comment Input */}
      <div className="flex gap-3">
        <Avatar initials="U" className="size-10" />
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comentario..."
            className="w-full resize-none rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <Button
              color="primary"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="gap-2 px-3 py-1.5 text-sm"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              {isSubmitting ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">
          <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar
                src={comment.user.avatarUrl}
                initials={comment.user.displayName.slice(0, 2).toUpperCase()}
                alt={comment.user.displayName}
                className="size-10"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900 dark:text-white">{comment.user.displayName}</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatRelativeDate(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{comment.content}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                  <button className="hover:text-neutral-700 dark:hover:text-neutral-300">Me gusta</button>
                  <button className="hover:text-neutral-700 dark:hover:text-neutral-300">Responder</button>
                  {comment._count?.likes ? <span>{comment._count.likes} me gusta</span> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
