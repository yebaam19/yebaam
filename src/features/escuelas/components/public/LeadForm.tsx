'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { submitLead } from '../../actions/lead.actions'

interface Props {
  schoolId: string
  programId?: string
}

export function LeadForm({ schoolId, programId }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('school_id', schoolId)
    if (programId) fd.set('program_id', programId)
    startTransition(async () => {
      try {
        await submitLead(fd)
        toast.success('¡Solicitud enviada! Nos pondremos en contacto contigo pronto.')
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al enviar')
      }
    })
  }

  return (
    <div className="border border-neutral-200 rounded-xl p-5">
      <h2 className="font-semibold mb-4">Solicitar información</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input name="name" required className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input name="email" type="email" required className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono *</label>
            <input name="phone" required className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Medio de contacto preferido *</label>
          <select name="preferred_contact_method" required className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm">
            <option value="WHATSAPP">WhatsApp</option>
            <option value="PHONE">Llamada</option>
            <option value="EMAIL">Email</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mensaje</label>
          <textarea name="message" rows={3} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={isPending} className="w-full py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-60">
          {isPending ? 'Enviando…' : 'Solicitar información'}
        </button>
      </form>
    </div>
  )
}
