'use client'

import { useState, useTransition } from 'react'
import { updateSpace } from '@/features/foro/actions/admin.actions'
import type { ForoSpace, SpaceVisibility } from '@/features/foro/types'

interface Props {
  space: ForoSpace
}

export default function SpaceSettingsForm({ space }: Props) {
  const [name, setName] = useState(space.name)
  const [description, setDescription] = useState(space.description ?? '')
  const [visibility, setVisibility] = useState<SpaceVisibility>(space.visibility)
  const [enabled, setEnabled] = useState(space.enabled)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await updateSpace({
        spaceId: space.id,
        name: name.trim(),
        description: description.trim() || null,
        visibility,
        enabled,
      })
      if (!result.ok) {
        setError(result.error ?? 'Error')
        return
      }
      setMessage('Cambios guardados.')
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
          {message}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Nombre
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Descripción
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Visibilidad
        </label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as SpaceVisibility)}
          className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="public">Público</option>
          <option value="private">Privado (solo miembros)</option>
          <option value="secret">Secreto (oculto)</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="rounded border-neutral-300"
        />
        Foro activo
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
        >
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
