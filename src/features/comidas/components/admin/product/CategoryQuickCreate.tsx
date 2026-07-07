'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createMenuCategory } from '../../../actions/menu.actions'

interface Props {
  businessId: string
  /** Compact mode: no explanatory copy, used inline inside ProductFormFields
   *  (which already has its own <form> — this component never renders its
   *  own <form>, so it's safe to nest anywhere). */
  compact?: boolean
  onCreated?: () => void
}

const INPUT = 'w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'

/**
 * Lets an admin create a menu category without leaving the Productos page.
 * No <form> element on purpose — this gets used both standalone (when a
 * business has zero categories) and nested inside ProductFormFields' own
 * <form> (to add a 2nd, 3rd... category) — HTML forbids nested <form>s.
 */
export function CategoryQuickCreate({ businessId, compact, onCreated }: Props) {
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!name.trim()) return
    startTransition(async () => {
      try {
        await createMenuCategory(businessId, name.trim())
        toast.success('Categoría creada')
        setName('')
        onCreated?.()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al crear la categoría')
      }
    })
  }

  const fields = (
    <div className={compact ? 'flex gap-2' : 'mt-3 flex gap-2'}>
      <label htmlFor="quick-category-name" className="sr-only">Nombre de la categoría</label>
      <input
        id="quick-category-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
        placeholder="Ej. Platos fuertes"
        className={INPUT}
      />
      <button
        type="button"
        onClick={handleCreate}
        disabled={isPending || !name.trim()}
        className="shrink-0 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {isPending ? 'Creando…' : 'Crear'}
      </button>
    </div>
  )

  if (compact) return fields

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-800">
        Tu menú todavía no tiene categorías
      </p>
      <p className="mt-1 text-xs text-amber-700">
        Crea una primera categoría (ej. &quot;Platos fuertes&quot;, &quot;Bebidas&quot;) para poder añadir productos.
      </p>
      {fields}
    </div>
  )
}
