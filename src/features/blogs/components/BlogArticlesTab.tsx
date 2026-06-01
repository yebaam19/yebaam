'use client'

import { NewspaperIcon, PlusIcon } from '@/components/icons/heroicons-shim'
import { useCallback, useEffect, useState } from 'react'

interface Article {
  id: string
  slug: string
  title: string
  subtitle: string | null
  summary: string | null
  content: string
  cfImageId: string | null
  createdAt: string
}

const inputClass =
  'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-white'

/** "Artículos" tab — written articles for the blog + owner composer (PDF #11). */
export function BlogArticlesTab({ blogId, isOwner }: { blogId: string; isOwner: boolean }) {
  const [articles, setArticles] = useState<Article[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [composerOpen, setComposerOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/blogs/${blogId}/articles`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((j: { articles?: Article[] }) => {
        setArticles(j.articles ?? [])
        setLoading(false)
      })
      .catch(() => {
        setArticles([])
        setLoading(false)
      })
  }, [blogId])

  useEffect(() => load(), [load])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/blogs/${blogId}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ title: title.trim(), summary: summary || undefined, content: content.trim() }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error || 'No se pudo publicar el artículo')
      }
      setTitle('')
      setSummary('')
      setContent('')
      setComposerOpen(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Artículos</h3>
        {isOwner && (
          <button
            type="button"
            onClick={() => setComposerOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4" />
            Escribir
          </button>
        )}
      </div>

      {isOwner && composerOpen && (
        <form onSubmit={submit} className="space-y-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del artículo"
            className={inputClass}
            required
          />
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Resumen (opcional)"
            className={inputClass}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe tu artículo…"
            rows={6}
            className={inputClass}
            required
          />
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Publicando…' : 'Publicar artículo'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando…</p>
      ) : articles && articles.length > 0 ? (
        <div className="space-y-3">
          {articles.map((a) => (
            <article key={a.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
              <h4 className="font-semibold text-neutral-900 dark:text-white">{a.title}</h4>
              {a.subtitle && <p className="text-sm text-neutral-600 dark:text-neutral-300">{a.subtitle}</p>}
              <p className="mt-0.5 text-xs text-neutral-500">
                {new Date(a.createdAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
              </p>
              {a.summary && <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{a.summary}</p>}
              {expanded === a.id && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">{a.content}</p>
              )}
              <button
                type="button"
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                className="mt-1.5 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
              >
                {expanded === a.id ? 'Leer menos' : 'Leer más'}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/60 p-8 text-center dark:border-neutral-700 dark:bg-neutral-900/40">
          <NewspaperIcon className="mx-auto mb-3 h-10 w-10 text-neutral-400" />
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Aún no hay artículos.</p>
        </div>
      )}
    </div>
  )
}
