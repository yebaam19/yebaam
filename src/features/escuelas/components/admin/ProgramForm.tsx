'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { BookOpen, Pencil, Plus } from 'lucide-react'
import { createProgram, deactivateProgram } from '../../actions/program.actions'
import type { Program, Discipline } from '../../types'
import { ProgramEditModal } from './program/ProgramEditModal'

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

const MODALITY_LABELS: Record<string, string> = {
  PRESENTIAL: 'Presencial', VIRTUAL: 'Virtual', HYBRID: 'Híbrido',
}
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado', PROFESSIONAL: 'Profesional',
}

interface Props {
  schoolId: string
  programs: Program[]
  disciplines: Discipline[]
}

export function ProgramForm({ schoolId, programs, disciplines }: Props) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<Program | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('school_id', schoolId)
    fd.set('slug', slugify(fd.get('name') as string))
    startTransition(async () => {
      try {
        await createProgram(fd)
        toast.success('Programa creado')
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Existing programs */}
      {programs.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Programas activos
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {programs.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                    <BookOpen size={15} className="text-violet-600" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight text-neutral-900 truncate">{p.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {MODALITY_LABELS[p.modality]} · {LEVEL_LABELS[p.level]}
                    </p>
                    {p.monthly_price != null && (
                      <p className="mt-1 text-xs font-semibold text-emerald-600">
                        ${Number(p.monthly_price).toLocaleString('es')}/mes
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => setEditing(p)}
                    className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-500 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                  >
                    <Pencil size={11} className="inline mr-1" />
                    Editar
                  </button>
                  {p.is_active && (
                    <button
                      onClick={() =>
                        startTransition(async () => {
                          await deactivateProgram(p.id, schoolId)
                          toast.success('Programa desactivado')
                        })
                      }
                      className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      Desactivar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add form */}
      <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50">
            <Plus size={16} className="text-violet-600" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-neutral-900">Nuevo programa</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Nombre <span className="text-red-500">*</span></label>
              <input name="name" required placeholder="Ej: Guitarra para principiantes" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Disciplina <span className="text-red-500">*</span></label>
              <select name="discipline_id" required className={SELECT}>
                <option value="">Seleccionar disciplina…</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={SECTION}>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">Formato</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Modalidad <span className="text-red-500">*</span></label>
                <select name="modality" required className={SELECT}>
                  <option value="PRESENTIAL">Presencial</option>
                  <option value="VIRTUAL">Virtual</option>
                  <option value="HYBRID">Híbrido</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Nivel <span className="text-red-500">*</span></label>
                <select name="level" required className={SELECT}>
                  <option value="BEGINNER">Principiante</option>
                  <option value="INTERMEDIATE">Intermedio</option>
                  <option value="ADVANCED">Avanzado</option>
                  <option value="PROFESSIONAL">Profesional</option>
                </select>
              </div>
            </div>
          </div>

          <div className={SECTION}>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">Descripción</p>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Resumen <span className="text-red-500">*</span></label>
                <input name="short_description" required maxLength={300} placeholder="Un resumen breve del programa…" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Descripción completa <span className="text-red-500">*</span></label>
                <textarea name="description" required rows={4} placeholder="Objetivos, contenido, metodología…" className={`${INPUT} resize-none`} />
              </div>
            </div>
          </div>

          <div className={SECTION}>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">Detalles</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Precio mensual <span className="text-red-500">*</span></label>
                <input name="monthly_price" type="number" min="0" required placeholder="0" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Rango de edad <span className="text-red-500">*</span></label>
                <input name="age_range" required placeholder="Ej: 8-15 años" className={INPUT} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Duración <span className="text-red-500">*</span></label>
                <input name="duration" required placeholder="Ej: 6 meses" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Horario <span className="text-red-500">*</span></label>
                <input name="schedule_summary" required placeholder="Lun y mié 6pm–8pm" className={INPUT} />
              </div>
            </div>
          </div>

          <div className={SECTION}>
            <div className="flex flex-wrap gap-5">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-neutral-700">
                <input name="trial_class_available" type="checkbox" value="true" className="h-4 w-4 rounded border-neutral-300 accent-primary-700" />
                Clase de prueba disponible
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-neutral-700">
                <input name="enrollment_open" type="checkbox" value="true" defaultChecked className="h-4 w-4 rounded border-neutral-300 accent-primary-700" />
                Inscripciones abiertas
              </label>
            </div>
          </div>

          <div className={SECTION}>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800 active:scale-95 disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : 'Crear programa'}
            </button>
          </div>
        </form>
      </section>

      {/* Edit modal */}
      {editing && (
        <ProgramEditModal
          program={editing}
          schoolId={schoolId}
          disciplines={disciplines}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
