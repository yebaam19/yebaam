'use client'

import { useState } from 'react'
import { Lock, Pencil } from 'lucide-react'

interface Props {
  slug: string
  onSlugChange: (slug: string) => void
  error?: string
}

function sanitize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
}

export function SlugField({ slug, onSlugChange, error }: Props) {
  const [editing, setEditing] = useState(false)

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor="slug-input" className="text-sm font-medium text-neutral-700">
          URL en Yebaam
        </label>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-pressed={editing}
          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 transition hover:text-neutral-700"
        >
          {editing ? (
            <><Lock size={11} aria-hidden /> Bloquear</>
          ) : (
            <><Pencil size={11} aria-hidden /> Editar URL</>
          )}
        </button>
      </div>

      <div
        className={[
          'flex items-center rounded-xl border bg-neutral-50 px-4 py-3 text-sm transition-shadow',
          'focus-within:bg-white focus-within:ring-2',
          error
            ? 'border-red-400 focus-within:ring-red-400/20'
            : 'border-neutral-200 focus-within:border-primary-500 focus-within:ring-primary-500/20',
        ].join(' ')}
      >
        <span className="shrink-0 select-none text-neutral-400 text-xs sm:text-sm">
          yebaam.com/negocios/
        </span>

        {editing ? (
          <input
            id="slug-input"
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(sanitize(e.target.value))}
            aria-label="Slug de la URL del negocio"
            aria-describedby={error ? 'slug-error' : 'slug-hint'}
            aria-invalid={!!error}
            autoFocus
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent font-mono text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
            placeholder="mi-negocio"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate font-mono text-sm text-neutral-900">
            {slug || <span className="text-neutral-400">mi-negocio</span>}
          </span>
        )}
      </div>

      {error ? (
        <p id="slug-error" role="alert" className="mt-1 flex items-center gap-1.5 text-xs text-red-500">
          <span aria-hidden>⚠</span> {error}
        </p>
      ) : (
        <p id="slug-hint" className="mt-1 text-xs text-neutral-400">
          {editing
            ? 'Solo letras minúsculas, números y guiones.'
            : 'Generada automáticamente. Haz clic en "Editar URL" para personalizarla.'}
        </p>
      )}
    </div>
  )
}
