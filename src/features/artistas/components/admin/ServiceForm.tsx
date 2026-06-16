'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { createServiceOffer, deactivateServiceOffer } from '../../actions/service.actions'
import type { ServiceOffer } from '../../types'

interface Props {
  profileId: string
  services: ServiceOffer[]
}

export function ServiceForm({ profileId, services }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('artist_profile_id', profileId)
    startTransition(async () => {
      try {
        await createServiceOffer(fd)
        toast.success('Servicio creado')
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <h2 className="text-lg font-semibold">Nuevo servicio</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Título *</label>
          <input name="title" required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo *</label>
          <select name="service_type" required className="w-full border border-border rounded-lg px-3 py-2 text-sm">
            {['LIVE_PERFORMANCE','PRIVATE_EVENT','BRAND_COLLABORATION','TEACHING','PRODUCTION','CONSULTING','COMMISSION_WORK','SESSION_WORK','CONTENT_CREATION','OTHER'].map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Precio desde</label>
            <input name="price_from" type="number" min="0" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Moneda</label>
            <input name="currency" defaultValue="COP" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Modalidad</label>
          <select name="location_mode" className="w-full border border-border rounded-lg px-3 py-2 text-sm">
            <option value="IN_PERSON">Presencial</option>
            <option value="ONLINE">Online</option>
            <option value="HYBRID">Híbrido</option>
            <option value="TO_BE_DEFINED">Por definir</option>
          </select>
        </div>
        <button type="submit" disabled={isPending} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {isPending ? 'Guardando…' : 'Crear servicio'}
        </button>
      </form>

      {services.length > 0 && (
        <ul className="space-y-2">
          {services.map((svc) => (
            <li key={svc.id} className="flex items-center justify-between border border-border rounded-lg p-3 text-sm">
              <div>
                <p className="font-medium">{svc.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{svc.service_type.replace(/_/g, ' ').toLowerCase()}</p>
              </div>
              <button
                onClick={() => startTransition(async () => { await deactivateServiceOffer(svc.id); toast.success('Desactivado') })}
                className="text-xs text-destructive hover:underline"
              >
                Desactivar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
