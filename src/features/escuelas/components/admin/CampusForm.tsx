'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { createCampus } from '../../actions/campus.actions'
import type { Campus } from '../../types'

interface Props {
  schoolId: string
  campuses: Campus[]
}

export function CampusForm({ schoolId, campuses }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('school_id', schoolId)
    startTransition(async () => {
      try {
        await createCampus(fd)
        toast.success('Sede creada')
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <h2 className="text-lg font-semibold">Nueva sede</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input name="name" required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ciudad *</label>
            <input name="city" required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono *</label>
            <input name="phone" required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dirección *</label>
          <input name="address" required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={isPending} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {isPending ? 'Guardando…' : 'Crear sede'}
        </button>
      </form>

      {campuses.length > 0 && (
        <ul className="space-y-2">
          {campuses.map((c) => (
            <li key={c.id} className="border border-border rounded-lg p-3 text-sm">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.city} · {c.address}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
