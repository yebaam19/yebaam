'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { createPromotion, updatePromotion, deactivatePromotion } from '../../actions/promotion.actions'
import type { Promotion } from '../../types'

interface Props {
  businessId: string
  promotions: Promotion[]
}

export function PromotionForm({ businessId, promotions }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('business_id', businessId)
    startTransition(async () => {
      try {
        await createPromotion(fd)
        toast.success('Promoción creada')
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <h2 className="text-lg font-semibold">Nueva promoción</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Título *</label>
          <input name="title" required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug *</label>
          <input name="slug" required pattern="[a-z0-9-]+" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea name="description" rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Inicia</label>
            <input name="starts_at" type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Termina</label>
            <input name="ends_at" type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <button type="submit" disabled={isPending} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {isPending ? 'Guardando…' : 'Crear promoción'}
        </button>
      </form>

      {promotions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Promociones existentes</h2>
          <ul className="space-y-2">
            {promotions.map((p) => (
              <li key={p.id} className="flex items-center justify-between border border-border rounded-lg p-3 text-sm">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.status.toLowerCase()}</p>
                </div>
                <button
                  onClick={() => startTransition(async () => { await deactivatePromotion(p.id); toast.success('Desactivada') })}
                  className="text-xs text-destructive hover:underline"
                >
                  Archivar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
