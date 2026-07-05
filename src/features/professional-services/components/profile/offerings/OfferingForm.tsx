'use client'

import { useId, useState } from 'react'

import type { OfferingInput } from '../../../actions/offerings.actions'
import type { ServiceOffering } from '../../../server/offerings.server'

interface OfferingFormProps {
  /** Presente al editar; ausente al crear. */
  initial?: ServiceOffering
  busy: boolean
  onSubmit: (values: OfferingInput) => void | Promise<void>
  onCancel: () => void
}

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100'

/**
 * Formulario inline para crear/editar un sub-servicio. Valida en cliente lo
 * mínimo (título 2-120, precio numérico ≥ 0); el server re-valida siempre.
 */
export function OfferingForm({ initial, busy, onSubmit, onCancel }: OfferingFormProps) {
  const uid = useId()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.priceFrom != null ? String(initial.priceFrom) : '')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 2 || trimmedTitle.length > 120) {
      setLocalError('El título debe tener entre 2 y 120 caracteres.')
      return
    }
    let priceFrom: number | null = null
    if (price.trim() !== '') {
      const parsed = Number(price.replace(',', '.'))
      if (!Number.isFinite(parsed) || parsed < 0) {
        setLocalError('El precio debe ser un número mayor o igual a 0.')
        return
      }
      priceFrom = parsed
    }
    setLocalError(null)
    await onSubmit({ title: trimmedTitle, description: description.trim() || null, priceFrom })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
      <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
        {initial ? 'Editar servicio' : 'Nuevo servicio'}
      </h3>

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor={`${uid}-title`} className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Título
          </label>
          <input
            id={`${uid}-title`}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            placeholder="Ej: Diseño de logotipo"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={`${uid}-description`} className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Descripción <span className="font-normal text-neutral-400">(opcional)</span>
          </label>
          <textarea
            id={`${uid}-description`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={600}
            placeholder="Describe qué incluye este servicio"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label htmlFor={`${uid}-price`} className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Precio «Desde» <span className="font-normal text-neutral-400">(opcional, COP)</span>
          </label>
          <input
            id={`${uid}-price`}
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ej: 150000"
            className={inputClass}
          />
        </div>
      </div>

      {localError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{localError}</p>}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {busy ? 'Guardando…' : initial ? 'Guardar cambios' : 'Agregar servicio'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-60 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
