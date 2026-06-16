'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createProduct, updateProduct, deactivateProduct } from '../../actions/product.actions'
import type { MenuWithCategories, Product } from '../../types'
import { Pencil, Trash2, Plus, X } from 'lucide-react'

interface Props {
  businessId: string
  menus: MenuWithCategories[]
}

function toSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

const INPUT = 'w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'
const LABEL = 'mb-1.5 block text-sm font-medium text-neutral-700'

function ProductFormFields({
  businessId, menus, editing, onCancel, onSaved,
}: {
  businessId: string
  menus: MenuWithCategories[]
  editing: Product | null
  onCancel: () => void
  onSaved: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(editing?.name ?? '')
  const [slug, setSlug] = useState(editing?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(!!editing?.slug)

  const allCategories = menus.flatMap((m) => m.categories)

  function handleNameChange(v: string) {
    setName(v)
    if (!slugEdited) setSlug(toSlug(v))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('business_id', businessId)
    fd.set('slug', slug)
    startTransition(async () => {
      try {
        if (editing) {
          await updateProduct(editing.id, fd)
          toast.success('Producto actualizado')
        } else {
          await createProduct(fd)
          toast.success('Producto creado')
        }
        onSaved()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-primary-200 bg-primary-50/30 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-900">
          {editing ? 'Editar producto' : 'Nuevo producto'}
        </h3>
        <button type="button" onClick={onCancel} aria-label="Cancelar" className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100">
          <X size={16} />
        </button>
      </div>

      <div>
        <label htmlFor="prod-category" className={LABEL}>Categoría de menú <span className="text-red-500">*</span></label>
        <select id="prod-category" name="category_id" defaultValue={editing?.category_id ?? ''} required className={INPUT}>
          <option value="">Seleccionar categoría…</option>
          {allCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="prod-name" className={LABEL}>Nombre <span className="text-red-500">*</span></label>
          <input id="prod-name" name="name" required value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Ej. Bandeja paisa" className={INPUT} />
        </div>
        <div>
          <label htmlFor="prod-slug" className={LABEL}>Slug</label>
          <input
            id="prod-slug"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
            placeholder="bandeja-paisa"
            className={INPUT + ' font-mono text-xs'}
            aria-describedby="slug-hint"
          />
          <p id="slug-hint" className="mt-1 text-xs text-neutral-400">Auto-generado desde el nombre.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="prod-price" className={LABEL}>Precio <span className="text-red-500">*</span></label>
          <input id="prod-price" name="price" type="number" step="0.01" min="0" required defaultValue={editing?.price} placeholder="0.00" className={INPUT} />
        </div>
        <div>
          <label htmlFor="prod-currency" className={LABEL}>Moneda</label>
          <input id="prod-currency" name="currency" defaultValue={editing?.currency ?? 'COP'} className={INPUT} />
        </div>
      </div>

      <div>
        <label htmlFor="prod-desc" className={LABEL}>Descripción corta</label>
        <input id="prod-desc" name="short_description" defaultValue={editing?.short_description ?? ''} placeholder="Una línea descriptiva del plato…" className={INPUT} />
      </div>

      <button
        type="submit"
        disabled={isPending || allCategories.length === 0}
        className="w-full rounded-2xl bg-primary-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-60 disabled:cursor-wait"
      >
        {isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear producto'}
      </button>

      {allCategories.length === 0 && (
        <p className="text-center text-xs text-amber-600">
          ⚠ El menú no tiene categorías. Crea una categoría de menú primero.
        </p>
      )}
    </form>
  )
}

export function ProductForm({ businessId, menus }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isPending, startTransition] = useTransition()

  const allProducts = menus.flatMap((m) => m.categories.flatMap((c) => c.products ?? []))

  function handleDeactivate(productId: string, productName: string) {
    if (!confirm(`¿Desactivar "${productName}"? Dejará de aparecer en el menú público.`)) return
    startTransition(async () => {
      try {
        await deactivateProduct(productId)
        toast.success('Producto desactivado')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al desactivar')
      }
    })
  }

  const isEditing = showForm || editingProduct !== null

  return (
    <div className="space-y-6">
      {/* Lista de productos */}
      {allProducts.length > 0 && (
        <section aria-label="Productos existentes">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">
            Productos ({allProducts.length})
          </h2>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
            {allProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {Number(product.price).toLocaleString('es-CO')} {product.currency}
                    {product.short_description ? ` · ${product.short_description}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setEditingProduct(product); setShowForm(false) }}
                    aria-label={`Editar ${product.name}`}
                    className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDeactivate(product.id, product.name)}
                    aria-label={`Desactivar ${product.name}`}
                    className="rounded-lg p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {allProducts.length === 0 && !isEditing && (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-12 text-center">
          <p className="text-4xl" aria-hidden>🍽️</p>
          <h2 className="mt-4 text-base font-semibold text-neutral-900">Sin productos aún</h2>
          <p className="mt-1 text-sm text-neutral-500">Añade tu primer plato o producto al menú.</p>
        </div>
      )}

      {/* Formulario create/edit */}
      {isEditing ? (
        <ProductFormFields
          businessId={businessId}
          menus={menus}
          editing={editingProduct}
          onCancel={() => { setShowForm(false); setEditingProduct(null) }}
          onSaved={() => { setShowForm(false); setEditingProduct(null) }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 px-4 py-4 text-sm font-medium text-neutral-600 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
        >
          <Plus size={16} aria-hidden />
          Añadir producto
        </button>
      )}
    </div>
  )
}
