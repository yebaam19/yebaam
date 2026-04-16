'use client'

import { forwardRef, useImperativeHandle, useRef, useState, useTransition } from 'react'
import { createPost } from '@/features/foro/actions/foro.actions'
import { Button } from '@/ui/Button'
import PostEditor, { type PostEditorHandle } from './PostEditor'

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
  const editorRef = useRef<PostEditorHandle>(null)

  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.focus(),
    prepend: (text: string) => editorRef.current?.prepend(text),
  }))

  if (isLocked) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
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
      className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <label
        htmlFor="reply-content"
        className="mb-2 block text-sm font-semibold text-neutral-700 dark:text-neutral-200"
      >
        Publicar respuesta
      </label>
      <PostEditor
        ref={editorRef}
        id="reply-content"
        value={content}
        onChange={setContent}
        placeholder="Escribe tu respuesta…"
        ariaLabel="Publicar respuesta"
        disabled={isPending}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-neutral-400">
          Formato: <code className="rounded bg-neutral-100 px-1 py-0.5 text-[10px] dark:bg-neutral-800">[b]</code>{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-[10px] dark:bg-neutral-800">[i]</code>{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-[10px] dark:bg-neutral-800">[url]</code>{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-[10px] dark:bg-neutral-800">[code]</code>{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-[10px] dark:bg-neutral-800">[quote]</code>
        </span>
        <Button
          type="submit"
          disabled={isPending || content.trim().length === 0}
          color="primary"
        >
          {isPending ? 'Enviando…' : 'Enviar respuesta'}
        </Button>
      </div>
    </form>
  )
})

export default ReplyForm
