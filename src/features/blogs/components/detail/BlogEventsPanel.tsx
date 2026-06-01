'use client'

import { useCallback, useEffect, useState } from 'react'

interface BlogEvent {
  id: string
  title: string
  description: string | null
  location: string | null
  startsAt: string
  endsAt: string | null
}

const inputClass =
  'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-white'

/** "Eventos" panel — public list + owner-only create form (PDF "Eventos"). */
export function BlogEventsPanel({ blogId, isOwner }: { blogId: string; isOwner: boolean }) {
  const [events, setEvents] = useState<BlogEvent[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/blogs/${blogId}/events`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((j: { events?: BlogEvent[] }) => {
        setEvents(j.events ?? [])
        setLoading(false)
      })
      .catch(() => {
        setEvents([])
        setLoading(false)
      })
  }, [blogId])

  useEffect(() => load(), [load])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !startsAt) return
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch(`/api/blogs/${blogId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: title.trim(),
          startsAt: new Date(startsAt).toISOString(),
          location: location || undefined,
          description: description || undefined,
        }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error || 'No se pudo crear el evento')
      }
      setTitle('')
      setStartsAt('')
      setLocation('')
      setDescription('')
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 text-sm">
      {loading ? (
        <p className="text-neutral-500 dark:text-neutral-400">Cargando…</p>
      ) : events && events.length > 0 ? (
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {events.map((ev) => (
            <li key={ev.id} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
              <p className="font-medium text-neutral-900 dark:text-white">{ev.title}</p>
              <p className="text-xs text-neutral-500">
                {new Date(ev.startsAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                {ev.location ? ` · ${ev.location}` : ''}
              </p>
              {ev.description && (
                <p className="mt-1 text-neutral-600 dark:text-neutral-300">{ev.description}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-neutral-500 dark:text-neutral-400">No hay eventos programados.</p>
      )}

      {isOwner && (
        <form onSubmit={submit} className="space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Nuevo evento</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del evento"
            className={inputClass}
            required
          />
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={inputClass}
            required
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Lugar (opcional)"
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={2}
            className={inputClass}
          />
          {formError && <p className="text-xs text-rose-500">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary-600 px-3 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Creando…' : 'Crear evento'}
          </button>
        </form>
      )}
    </div>
  )
}
