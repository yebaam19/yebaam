'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { updateProgram } from '../../../actions/program.actions'
import type { Program, Discipline } from '../../../types'

const INPUT = [
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5',
  'text-sm text-neutral-900 placeholder:text-neutral-400',
  'outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
].join(' ')

const SELECT = [
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5',
  'text-sm text-neutral-900 outline-none transition',
  'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
].join(' ')

const LABEL = 'mb-1.5 block text-sm font-semibold text-neutral-700'
const SECTION = 'border-t border-neutral-100 pt-5'

function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

interface Props {
  program: Program
  schoolId: string
  disciplines: Discipline[]
  onClose: () => void
}

export function ProgramEditModal({ program, schoolId, disciplines, onClose }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('slug', slugify(fd.get('name') as string))
    startTransition(async () => {
      try {
        await updateProgram(schoolId, program.id, fd)
        toast.success('Programa actualizado')
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
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-base font-bold text-neutral-900">Editar programa</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            {/* Identidad */}
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Nombre <span className="text-red-500">*</span></label>
                <input name="name" required defaultValue={program.name} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Disciplina <span className="text-red-500">*</span></label>
                <select name="discipline_id" required defaultValue={program.discipline_id} className={SELECT}>
                  <option value="">Seleccionar disciplina…</option>
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Formato */}
            <div className={SECTION}>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">Formato</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Modalidad <span className="text-red-500">*</span></label>
                  <select name="modality" required defaultValue={program.modality} className={SELECT}>
                    <option value="PRESENTIAL">Presencial</option>
                    <option value="VIRTUAL">Virtual</option>
                    <option value="HYBRID">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Nivel <span className="text-red-500">*</span></label>
                  <select name="level" required defaultValue={program.level} className={SELECT}>
                    <option value="BEGINNER">Principiante</option>
                    <option value="INTERMEDIATE">Intermedio</option>
                    <option value="ADVANCED">Avanzado</option>
                    <option value="PROFESSIONAL">Profesional</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className={SECTION}>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">Descripción</p>
              <div className="space-y-4">
                <div>
                  <label className={LABEL}>Resumen <span className="text-red-500">*</span></label>
                  <input name="short_description" required maxLength={300} defaultValue={program.short_description} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Descripción completa <span className="text-red-500">*</span></label>
                  <textarea name="description" required rows={4} defaultValue={program.description} className={`${INPUT} resize-none`} />
                </div>
              </div>
            </div>

            {/* Detalles */}
            <div className={SECTION}>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">Detalles</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Precio mensual <span className="text-red-500">*</span></label>
                  <input name="monthly_price" type="number" min="0" required defaultValue={program.monthly_price} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Rango de edad <span className="text-red-500">*</span></label>
                  <input name="age_range" required defaultValue={program.age_range} className={INPUT} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Duración <span className="text-red-500">*</span></label>
                  <input name="duration" required defaultValue={program.duration} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Horario <span className="text-red-500">*</span></label>
                  <input name="schedule_summary" required defaultValue={program.schedule_summary} className={INPUT} />
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className={SECTION}>
              <div className="flex flex-wrap gap-5">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-neutral-700">
                  <input
                    name="trial_class_available"
                    type="checkbox"
                    value="true"
                    defaultChecked={program.trial_class_available}
                    className="h-4 w-4 rounded border-neutral-300 accent-primary-700"
                  />
                  Clase de prueba disponible
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-neutral-700">
                  <input
                    name="enrollment_open"
                    type="checkbox"
                    value="true"
                    defaultChecked={program.enrollment_open}
                    className="h-4 w-4 rounded border-neutral-300 accent-primary-700"
                  />
                  Inscripciones abiertas
                </label>
              </div>
            </div>

            <div className={`${SECTION} flex gap-3`}>
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
    </div>
  )
}
