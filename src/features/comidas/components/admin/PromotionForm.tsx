'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, X, Pencil, Archive } from 'lucide-react'
import { createPromotion, updatePromotion, deactivatePromotion } from '../../actions/promotion.actions'
import type { Promotion } from '../../types'

interface Props {
  businessId: string
  promotions: Promotion[]
}

function toSlug(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 100)
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT:    'Borrador',
  ACTIVE:   'Activa',
  EXPIRED:  'Expirada',
  ARCHIVED: 'Archivada',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:    'bg-neutral-100 text-neutral-600',
  ACTIVE:   'bg-green-100 text-green-700',
  EXPIRED:  'bg-amber-100 text-amber-700',
  ARCHIVED: 'bg-red-50 text-red-600',
}

const INPUT = 'w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'
const LABEL = 'mb-1.5 block text-sm font-medium text-neutral-700'

function PromotionFormFields({
  businessId, editing, onCancel, onSaved,
}: {
  businessId: string
  editing: Promotion | null
  onCancel: () => void
  onSaved: () => void
}) {
  const [isPending, start] = useTransition()
  const [title, setTitle] = useState(editing?.title ?? '')
  const [slug, setSlug]   = useState(editing?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(!!editing?.slug)

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slugEdited) setSlug(toSlug(v))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('business_id', businessId)
    fd.set('slug', slug)
    start(async () => {
      try {
        if (editing) {
          await updatePromotion(editing.id, fd)
          toast.success('Promoción actualizada')
        } else {
          await createPromotion(fd)
          toast.success('Promoción creada')
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
          {editing ? 'Editar promoción' : 'Nueva promoción'}
        </h3>
        <button type="button" onClick={onCancel} aria-label="Cancelar" className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="promo-title" className={LABEL}>Título <span className="text-red-500">*</span></label>
          <input id="promo-title" name="title" required value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Ej. 2×1 en pizzas" className={INPUT} />
        </div>
        <div>
          <label htmlFor="promo-slug" className={LABEL}>Slug</label>
          <input
            id="promo-slug"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
            placeholder="2x1-en-pizzas"
            className={INPUT + ' font-mono text-xs'}
          />
        </div>
      </div>

      <div>
        <label htmlFor="promo-desc" className={LABEL}>Descripción</label>
        <textarea id="promo-desc" name="description" rows={3} defaultValue={editing?.description ?? ''} placeholder="Detalles de la promoción…" className={INPUT + ' resize-none'} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="promo-starts" className={LABEL}>Fecha de inicio</label>
          <input id="promo-starts" name="starts_at" type="date" defaultValue={editing?.starts_at?.slice(0, 10) ?? ''} className={INPUT} />
        </div>
        <div>
          <label htmlFor="promo-ends" className={LABEL}>Fecha de fin</label>
          <input id="promo-ends" name="ends_at" type="date" defaultValue={editing?.ends_at?.slice(0, 10) ?? ''} className={INPUT} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="promo-cta-label" className={LABEL}>Texto del botón CTA</label>
          <input id="promo-cta-label" name="cta_label" defaultValue={editing?.cta_label ?? ''} placeholder="Ver oferta" className={INPUT} />
        </div>
        <div>
          <label htmlFor="promo-cta-url" className={LABEL}>URL del CTA</label>
          <input id="promo-cta-url" name="cta_url" type="url" defaultValue={editing?.cta_url ?? ''} placeholder="https://…" className={INPUT} />
        </div>
      </div>

      {editing && (
        <div>
          <label htmlFor="promo-status" className={LABEL}>Estado</label>
          <select id="promo-status" name="status" defaultValue={editing.status} className={INPUT}>
            <option value="DRAFT">Borrador</option>
            <option value="ACTIVE">Activa</option>
            <option value="EXPIRED">Expirada</option>
            <option value="ARCHIVED">Archivada</option>
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-primary-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-60 disabled:cursor-wait"
      >
        {isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear promoción'}
      </button>
    </form>
  )
}

export function PromotionForm({ businessId, promotions }: Props) {
  const [showForm, setShowForm]         = useState(false)
  const [editing, setEditing]           = useState<Promotion | null>(null)
  const [isPending, start]              = useTransition()

  function handleArchive(promo: Promotion) {
    if (!confirm(`¿Archivar "${promo.title}"?`)) return
    start(async () => {
      try {
        await deactivatePromotion(promo.id)
        toast.success('Promoción archivada')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al archivar')
      }
    })
  }

  const isEditing = showForm || editing !== null

  return (
    <div className="space-y-6">
      {/* Lista existente */}
      {promotions.length > 0 && (
        <section aria-label="Promociones existentes">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">
            Promociones ({promotions.length})
          </h2>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
            {promotions.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{p.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] ?? ''}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                    {p.starts_at && (
                      <span className="text-xs text-neutral-400">
                        {new Date(p.starts_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        {p.ends_at ? ` → ${new Date(p.ends_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setEditing(p); setShowForm(false) }}
                    aria-label={`Editar ${p.title}`}
                    className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    <Pencil size={14} />
                  </button>
                  {p.status !== 'ARCHIVED' && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleArchive(p)}
                      aria-label={`Archivar ${p.title}`}
                      className="rounded-lg p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Archive size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {promotions.length === 0 && !isEditing && (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-12 text-center">
          <p className="text-4xl" aria-hidden>🎁</p>
          <h2 className="mt-4 text-base font-semibold text-neutral-900">Sin promociones aún</h2>
          <p className="mt-1 text-sm text-neutral-500">Crea descuentos, ofertas especiales y combos para atraer clientes.</p>
        </div>
      )}

      {/* Formulario create/edit */}
      {isEditing ? (
        <PromotionFormFields
          businessId={businessId}
          editing={editing}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => { setShowForm(false); setEditing(null) }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 px-4 py-4 text-sm font-medium text-neutral-600 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
        >
          <Plus size={16} aria-hidden />
          Añadir promoción
        </button>
      )}
    </div>
  )
}
