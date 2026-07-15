'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { updateCampus } from '../../../actions/campus.actions'
import type { Campus } from '../../../types'

const INPUT = [
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5',
  'text-sm text-neutral-900 placeholder:text-neutral-400',
  'outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
].join(' ')

const LABEL = 'mb-1.5 block text-sm font-semibold text-neutral-700'

interface Props {
  campus: Campus
  schoolId: string
  onClose: () => void
}

export function CampusEditModal({ campus, schoolId, onClose }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateCampus(schoolId, campus.id, fd)
        toast.success('Sede actualizada')
        onClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-base font-bold text-neutral-900">Editar sede</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className={LABEL}>Nombre <span className="text-red-500">*</span></label>
            <input name="name" required defaultValue={campus.name} className={INPUT} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Ciudad <span className="text-red-500">*</span></label>
              <input name="city" required defaultValue={campus.city} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Teléfono <span className="text-red-500">*</span></label>
              <input name="phone" required defaultValue={campus.phone} className={INPUT} />
            </div>
          </div>

          <div>
            <label className={LABEL}>Dirección <span className="text-red-500">*</span></label>
            <input name="address" required defaultValue={campus.address} className={INPUT} />
          </div>

          <div className="flex gap-3 border-t border-neutral-100 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800 active:scale-95 disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
