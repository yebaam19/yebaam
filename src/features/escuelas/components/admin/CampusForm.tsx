'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { MapPin, Pencil, Plus } from 'lucide-react'
import { createCampus } from '../../actions/campus.actions'
import type { Campus } from '../../types'
import { CampusEditModal } from './campus/CampusEditModal'

const INPUT = [
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5',
  'text-sm text-neutral-900 placeholder:text-neutral-400',
  'outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
].join(' ')

const LABEL = 'mb-1.5 block text-sm font-semibold text-neutral-700'

interface Props {
  schoolId: string
  campuses: Campus[]
}

export function CampusForm({ schoolId, campuses }: Props) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<Campus | null>(null)

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
    <div className="space-y-8">
      {/* Existing campuses */}
      {campuses.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Sedes registradas
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {campuses.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <MapPin size={15} className="text-orange-600" aria-hidden="true" />
                </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold leading-tight text-neutral-900">{c.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{c.city}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-neutral-400">{c.address}</p>
                  </div>
                  <button
                    onClick={() => setEditing(c)}
                    className="shrink-0 self-start rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-500 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                  >
                    <Pencil size={11} className="inline mr-1" />
                    Editar
                  </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add form */}
      <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50">
            <Plus size={16} className="text-orange-600" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-neutral-900">Nueva sede</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className={LABEL}>Nombre <span className="text-red-500">*</span></label>
            <input name="name" required placeholder="Ej: Sede Norte" className={INPUT} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Ciudad <span className="text-red-500">*</span></label>
              <input name="city" required placeholder="Ej: Bogotá" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Teléfono <span className="text-red-500">*</span></label>
              <input name="phone" required placeholder="+57 300 000 0000" className={INPUT} />
            </div>
          </div>

          <div>
            <label className={LABEL}>Dirección <span className="text-red-500">*</span></label>
            <input name="address" required placeholder="Calle 100 # 15-30" className={INPUT} />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800 active:scale-95 disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : 'Crear sede'}
            </button>
          </div>
        </form>
      </section>

      {/* Edit modal */}
      {editing && (
        <CampusEditModal
          campus={editing}
          schoolId={schoolId}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
