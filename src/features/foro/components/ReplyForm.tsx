'use client'

import { useState, useTransition } from 'react'
import { createPost } from '@/features/foro/actions/foro.actions'

interface Props {
  topicId: string
  isLocked: boolean
  onPosted?: () => void
}

export default function ReplyForm({ topicId, isLocked, onPosted }: Props) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (isLocked) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        Este tema está cerrado. No se pueden añadir más mensajes.
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const value = content.trim()
    if (!value) return
    startTransition(async () => {
      const result = await createPost({ topicId, content: value })
      if (!result.ok) {
        setError(result.error ?? 'No se pudo enviar el mensaje.')
        return
      }
      setContent('')
      onPosted?.()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <label htmlFor="reply-content" className="sr-only">
        Mensaje
      </label>
      <textarea
        id="reply-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tu respuesta…"
        rows={4}
        className="block w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        disabled={isPending}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={isPending || content.trim().length === 0}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Enviando…' : 'Responder'}
        </button>
      </div>
    </form>
  )
}
