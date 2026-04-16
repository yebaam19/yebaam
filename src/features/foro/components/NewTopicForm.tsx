'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { createTopic } from '@/features/foro/actions/foro.actions'
import { Button } from '@/ui/Button'

interface Props {
  spaceSlug: string
  forumId: string
  forumSlug: string
  forumName: string
}

export default function NewTopicForm({
  spaceSlug,
  forumId,
  forumSlug,
}: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!canSubmit) return
    startTransition(async () => {
      const result = await createTopic({ forumId, title, content })
      if (!result.ok) {
        setError(result.error ?? 'No se pudo crear el tema.')
        return
      }
      router.push(
        `/foro/${result.spaceSlug}/${result.forumSlug}/${result.topicSlug}` as Route,
      )
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div>
        <label
          htmlFor="topic-title"
          className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200"
        >
          Título del tema
        </label>
        <input
          id="topic-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          placeholder="Escribe un título claro y descriptivo"
          className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          disabled={isPending}
        />
        <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Máximo 200 caracteres.</span>
          <span>{title.length}/200</span>
        </div>
      </div>
      <div>
        <label
          htmlFor="topic-content"
          className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200"
        >
          Mensaje
        </label>
        <textarea
          id="topic-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          required
          placeholder="Escribe el primer mensaje del tema…"
          className="mt-1 block w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          disabled={isPending}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          href={`/foro/${spaceSlug}/${forumSlug}` as Route}
          plain
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={!canSubmit} color="primary">
          {isPending ? 'Publicando…' : 'Publicar tema'}
        </Button>
      </div>
    </form>
  )
}
