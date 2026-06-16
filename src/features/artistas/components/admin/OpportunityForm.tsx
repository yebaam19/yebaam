'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { createOpportunity, updateOpportunityStatus } from '../../actions/opportunity.actions'
import type { Opportunity, OpportunityStatus } from '../../types'

interface Props {
  profileId: string
  opportunities: Opportunity[]
}

export function OpportunityForm({ profileId, opportunities }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createOpportunity(fd)
        toast.success('Oportunidad creada')
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <h2 className="text-lg font-semibold">Nueva oportunidad</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Título *</label>
          <input name="title" required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug *</label>
          <input name="slug" required pattern="[a-z0-9-]+" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo *</label>
          <select name="type" required className="w-full border border-border rounded-lg px-3 py-2 text-sm">
            {['CASTING','AUDITION','COLLABORATION','JOB','FESTIVAL','EXHIBITION','CONTEST','CULTURAL_CALL','BRAND_CAMPAIGN','OTHER'].map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción *</label>
          <textarea name="description" required rows={4} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha límite</label>
          <input name="deadline" type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={isPending} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {isPending ? 'Guardando…' : 'Crear oportunidad'}
        </button>
      </form>

      {opportunities.length > 0 && (
        <ul className="space-y-2">
          {opportunities.map((opp) => (
            <li key={opp.id} className="flex items-center justify-between border border-border rounded-lg p-3 text-sm">
              <div>
                <p className="font-medium">{opp.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{opp.status.toLowerCase()}</p>
              </div>
              {opp.status === 'OPEN' && (
                <button
                  onClick={() => startTransition(async () => { await updateOpportunityStatus(opp.id, 'CLOSED'); toast.success('Cerrada') })}
                  className="text-xs text-destructive hover:underline"
                >
                  Cerrar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
