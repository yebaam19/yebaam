'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { createTopic } from '@/features/foro/actions/foro.actions'

interface Props {
  spaceSlug: string
  forumId: string
  forumSlug: string
  forumName: string
}

export default function NewTopicForm({ spaceSlug, forumId, forumSlug, forumName }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
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
    <div className="space-y-4">
      <nav className="text-xs text-neutral-500 dark:text-neutral-400">
        <Link href="/foro" className="hover:text-blue-600">
          Foro
        </Link>
        {' › '}
        <Link href={`/foro/${spaceSlug}/${forumSlug}` as Route} className="hover:text-blue-600">
          {forumName}
        </Link>
        {' › '}
        <span className="text-neutral-700 dark:text-neutral-300">Nuevo tema</span>
      </nav>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div>
          <label
            htmlFor="topic-title"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Título
          </label>
          <input
            id="topic-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            disabled={isPending}
          />
        </div>
        <div>
          <label
            htmlFor="topic-content"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Mensaje
          </label>
          <textarea
            id="topic-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            required
            className="mt-1 block w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            disabled={isPending}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/foro/${spaceSlug}/${forumSlug}` as Route}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending || !title.trim() || !content.trim()}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Publicando…' : 'Publicar tema'}
          </button>
        </div>
      </form>
    </div>
  )
}
