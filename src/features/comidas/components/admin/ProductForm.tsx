'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { createProduct, updateProduct, deactivateProduct } from '../../actions/product.actions'
import type { MenuWithCategories, Product } from '../../types'

interface Props {
  businessId: string
  menus: MenuWithCategories[]
  product?: Product
}

export function ProductForm({ businessId, menus, product }: Props) {
  const [isPending, startTransition] = useTransition()

  const allCategories = menus.flatMap((m) => m.categories)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('business_id', businessId)
    startTransition(async () => {
      try {
        if (product) {
          await updateProduct(product.id, fd)
          toast.success('Producto actualizado')
        } else {
          await createProduct(fd)
          toast.success('Producto creado')
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium mb-1">Categoría de menú *</label>
        <select name="category_id" defaultValue={product?.category_id} required className="w-full border border-border rounded-lg px-3 py-2 text-sm">
          <option value="">Seleccionar…</option>
          {allCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Nombre *</label>
        <input name="name" defaultValue={product?.name} required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Slug *</label>
        <input name="slug" defaultValue={product?.slug} required pattern="[a-z0-9-]+" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Precio *</label>
          <input name="price" type="number" step="0.01" min="0" defaultValue={product?.price} required className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Moneda</label>
          <input name="currency" defaultValue={product?.currency ?? 'COP'} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Descripción corta</label>
        <input name="short_description" defaultValue={product?.short_description ?? ''} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      </div>
      <button type="submit" disabled={isPending} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
        {isPending ? 'Guardando…' : product ? 'Actualizar' : 'Crear producto'}
      </button>
    </form>
  )
}
