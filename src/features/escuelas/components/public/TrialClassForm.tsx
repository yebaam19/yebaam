'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { requestTrialClass } from '../../actions/trial.actions'

interface Props {
  schoolId: string
  programId?: string
}

export function TrialClassForm({ schoolId, programId }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('school_id', schoolId)
    if (programId) fd.set('program_id', programId)
    startTransition(async () => {
      try {
        await requestTrialClass(fd)
        toast.success('¡Clase de prueba solicitada! Te confirmaremos la fecha.')
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al enviar')
      }
    })
  }

  return (
    <div className="border border-neutral-200 rounded-xl p-5 bg-neutral-50">
      <h2 className="font-semibold mb-4">Solicitar clase de prueba gratuita</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input name="name" required className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-background" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input name="email" type="email" required className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-background" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono *</label>
            <input name="phone" required className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-background" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha preferida *</label>
          <input name="preferred_date" type="date" required min={new Date().toISOString().split('T')[0]} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-background" />
        </div>
        <button type="submit" disabled={isPending} className="w-full py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-60">
          {isPending ? 'Enviando…' : 'Reservar clase de prueba'}
        </button>
      </form>
    </div>
  )
}
