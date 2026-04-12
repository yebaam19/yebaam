'use client'

import { useState } from 'react'
import { CommentTextarea } from './CommentTextarea'
import { SubmitButton } from './SubmitButton'

interface CommentContentProps {
  content: string
  commentId: string
  isEditing: boolean
  onEdit: (newContent: string) => Promise<void>
  onCancelEdit: () => void
}

/**
 * Contenido del comentario
 * Muestra texto normal o textarea en modo edición
 */
export function CommentContent({ content, commentId, isEditing, onEdit, onCancelEdit }: CommentContentProps) {
  const [editContent, setEditContent] = useState(content)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editContent.trim() || editContent === content) {
      onCancelEdit()
      return
    }

    setIsSubmitting(true)
    try {
      await onEdit(editContent.trim())
    } catch (error) {
      console.error('Error al editar comentario:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmitEdit} className="flex w-full min-w-0 flex-col gap-2">
        <div className="min-w-0">
          <CommentTextarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={isSubmitting}
            maxLength={500}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={isSubmitting}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            Cancelar
          </button>
          <SubmitButton isLoading={isSubmitting} hasContent={editContent.trim().length > 0} />
        </div>
      </form>
    )
  }

  return (
    <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
      {content}
    </p>
  )
}
