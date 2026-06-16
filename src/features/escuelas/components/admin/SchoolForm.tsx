'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateSchool } from '../../actions/school.actions'
import type { School } from '../../types'

interface Props {
  school: School
}

const CATEGORY_LABELS = {
  MUSIC: 'Música',
  ARTS: 'Artes',
  DANCE: 'Danza',
  THEATER: 'Teatro',
  MULTIDISCIPLINARY: 'Multidisciplinaria',
}

const TYPE_LABELS = {
  PRIVATE: 'Privada',
  PUBLIC: 'Pública',
  NON_PROFIT: 'Sin fines de lucro',
  COLLEGE: 'Universitaria',
}

export function SchoolForm({ school }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateSchool(school.id, fd)
        toast.success('Escuela actualizada')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">General</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input name="name" required defaultValue={school.name} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input name="slug" required defaultValue={school.slug} pattern="[a-z0-9-]+" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Categoría *</label>
            <select name="category" required defaultValue={school.category} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo *</label>
            <select name="school_type" required defaultValue={school.school_type} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción *</label>
          <textarea name="description" required rows={3} defaultValue={school.description} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contacto</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ciudad *</label>
            <input name="city" required defaultValue={school.city} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono *</label>
            <input name="phone" required defaultValue={school.phone} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dirección *</label>
          <input name="address" required defaultValue={school.address} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp *</label>
            <input name="whatsapp" required defaultValue={school.whatsapp} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input name="email" type="email" required defaultValue={school.email} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sitio web</label>
          <input name="website" type="url" defaultValue={school.website ?? ''} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Redes sociales</h3>
        <div className="grid grid-cols-2 gap-4">
          {(['instagram', 'facebook', 'tiktok', 'youtube'] as const).map((net) => (
            <div key={net}>
              <label className="block text-sm font-medium mb-1 capitalize">{net}</label>
              <input name={net} defaultValue={(school as unknown as Record<string, string | null>)[net] ?? ''} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Formulario de leads</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">CTA principal</label>
            <input name="primary_cta_label" defaultValue={school.primary_cta_label ?? ''} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CTA secundario</label>
            <input name="secondary_cta_label" defaultValue={school.secondary_cta_label ?? ''} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Título del formulario</label>
          <input name="lead_form_title" defaultValue={school.lead_form_title ?? ''} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción del formulario</label>
          <textarea name="lead_form_description" rows={2} defaultValue={school.lead_form_description ?? ''} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mensaje clase de prueba</label>
          <textarea name="trial_class_message" rows={2} defaultValue={school.trial_class_message ?? ''} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
      </section>

      <button type="submit" disabled={isPending} className="px-8 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-60">
        {isPending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
