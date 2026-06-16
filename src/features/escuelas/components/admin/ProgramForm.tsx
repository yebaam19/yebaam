'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { createProgram, deactivateProgram } from '../../actions/program.actions'
import type { Program, Discipline } from '../../types'

interface Props {
  schoolId: string
  programs: Program[]
  disciplines: Discipline[]
}

export function ProgramForm({ schoolId, programs, disciplines }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('school_id', schoolId)
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <h2 className="text-lg font-semibold">Nuevo programa</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input name="name" required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug *</label>
          <input name="slug" required pattern="[a-z0-9-]+" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Disciplina *</label>
          <select name="discipline_id" required className="w-full border border-border rounded-lg px-3 py-2 text-sm">
            <option value="">Seleccionar…</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Modalidad *</label>
            <select name="modality" required className="w-full border border-border rounded-lg px-3 py-2 text-sm">
              <option value="PRESENTIAL">Presencial</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="HYBRID">Híbrido</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nivel *</label>
            <select name="level" required className="w-full border border-border rounded-lg px-3 py-2 text-sm">
              <option value="BEGINNER">Principiante</option>
              <option value="INTERMEDIATE">Intermedio</option>
              <option value="ADVANCED">Avanzado</option>
              <option value="PROFESSIONAL">Profesional</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción corta *</label>
          <input name="short_description" required maxLength={300} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción completa *</label>
          <textarea name="description" required rows={4} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Precio mensual *</label>
            <input name="monthly_price" type="number" min="0" required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rango de edad *</label>
            <input name="age_range" required placeholder="Ej: 8-15 años" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Duración *</label>
          <input name="duration" required placeholder="Ej: 6 meses" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Horario *</label>
          <input name="schedule_summary" required placeholder="Ej: Lunes y miércoles 6pm-8pm" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input name="trial_class_available" type="checkbox" value="true" />
            Clase de prueba disponible
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="enrollment_open" type="checkbox" value="true" defaultChecked />
            Inscripciones abiertas
          </label>
        </div>
        <button type="submit" disabled={isPending} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {isPending ? 'Guardando…' : 'Crear programa'}
        </button>
      </form>

      {programs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Programas existentes</h2>
          <ul className="space-y-2">
            {programs.map((p) => (
              <li key={p.id} className="flex items-center justify-between border border-border rounded-lg p-3 text-sm">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.modality.toLowerCase()} · {p.level.toLowerCase()}</p>
                </div>
                {p.is_active && (
                  <button
                    onClick={() => startTransition(async () => { await deactivateProgram(p.id); toast.success('Desactivado') })}
                    className="text-xs text-destructive hover:underline"
                  >
                    Desactivar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
