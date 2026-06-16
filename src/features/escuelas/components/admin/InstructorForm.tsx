'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { createInstructor } from '../../actions/instructor.actions'
import type { Instructor } from '../../types'

interface Props {
  schoolId: string
  instructors: Instructor[]
}

export function InstructorForm({ schoolId, instructors }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('school_id', schoolId)
    startTransition(async () => {
      try {
        await createInstructor(fd)
        toast.success('Instructor creado')
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <h2 className="text-lg font-semibold">Nuevo instructor</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input name="name" required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Especialidades *</label>
          <input name="specialties" required placeholder="Ej: Guitarra, Teoría musical" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Biografía *</label>
          <textarea name="bio" required rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Instagram</label>
          <input name="instagram" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={isPending} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {isPending ? 'Guardando…' : 'Crear instructor'}
        </button>
      </form>

      {instructors.length > 0 && (
        <ul className="space-y-2">
          {instructors.map((inst) => (
            <li key={inst.id} className="border border-border rounded-lg p-3 text-sm">
              <p className="font-medium">{inst.name}</p>
              <p className="text-xs text-muted-foreground">{inst.specialties}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
