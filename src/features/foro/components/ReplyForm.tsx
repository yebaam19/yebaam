'use client'

import { forwardRef, useImperativeHandle, useRef, useState, useTransition } from 'react'
import { createPost } from '@/features/foro/actions/foro.actions'

interface Props {
  topicId: string
  isLocked: boolean
  onPosted?: () => void
}

export interface ReplyFormHandle {
  focus: () => void
  prepend: (text: string) => void
}

const ReplyForm = forwardRef<ReplyFormHandle, Props>(function ReplyForm(
  { topicId, isLocked, onPosted },
  ref,
) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus()
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    },
    prepend: (text: string) => {
      setContent((prev) => (prev ? text + prev : text))
      setTimeout(() => {
        textareaRef.current?.focus()
        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 0)
    },
  }))

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
      <label htmlFor="reply-content" className="mb-2 block text-xs font-semibold text-neutral-600 dark:text-neutral-300">
        Publicar respuesta
      </label>
      <textarea
        id="reply-content"
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tu respuesta…"
        rows={6}
        className="block w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        disabled={isPending}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400">
          Puedes usar [quote=autor]…[/quote] para citar.
        </span>
        <button
          type="submit"
          disabled={isPending || content.trim().length === 0}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Enviando…' : 'Enviar respuesta'}
        </button>
      </div>
    </form>
  )
})

export default ReplyForm
