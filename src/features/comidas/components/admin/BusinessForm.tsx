'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createBusiness, updateBusiness } from '../../actions/business.actions'
import type { Business } from '../../types'

interface Props {
  business?: Business
}

export function BusinessForm({ business }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        if (business) {
          await updateBusiness(business.id, fd)
          toast.success('Negocio actualizado')
        } else {
          const result = await createBusiness(fd)
          toast.success('Negocio creado')
          router.push(`/negocios/admin/${result.id}`)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre *</label>
        <input name="name" defaultValue={business?.name} required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Slug *</label>
        <input name="slug" defaultValue={business?.slug} required pattern="[a-z0-9-]+" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Categoría *</label>
        <input name="category" defaultValue={business?.category} required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <textarea name="description" defaultValue={business?.description ?? ''} rows={4} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ciudad</label>
          <input name="city" defaultValue={business?.city ?? ''} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">WhatsApp</label>
          <input name="whatsapp" defaultValue={business?.whatsapp ?? ''} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Instagram</label>
        <input name="instagram" defaultValue={business?.instagram ?? ''} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      </div>
      <button type="submit" disabled={isPending} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
        {isPending ? 'Guardando…' : business ? 'Actualizar' : 'Crear negocio'}
      </button>
    </form>
  )
}
