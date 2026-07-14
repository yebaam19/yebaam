'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateSchool } from '../../actions/school.actions'
import type { School } from '../../types'

interface Props { school: School }

const INPUT = 'w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
const LABEL = 'mb-1.5 block text-sm font-semibold text-neutral-700'

const CATEGORY_LABELS = {
  MUSIC: 'Música', ARTS: 'Artes', DANCE: 'Danza', THEATER: 'Teatro', MULTIDISCIPLINARY: 'Multidisciplinaria',
}
const TYPE_LABELS = {
  PRIVATE: 'Privada', PUBLIC: 'Pública', NON_PROFIT: 'Sin fines de lucro', COLLEGE: 'Universitaria',
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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* General */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">General</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Nombre *</label>
            <input name="name" required defaultValue={school.name} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Slug *</label>
            <input name="slug" required defaultValue={school.slug} pattern="[a-z0-9-]+" className={INPUT + ' font-mono text-xs'} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Categoría *</label>
            <select name="category" required defaultValue={school.category} className={INPUT}>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Tipo *</label>
            <select name="school_type" required defaultValue={school.school_type} className={INPUT}>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={LABEL}>Descripción *</label>
          <textarea name="description" required rows={3} defaultValue={school.description} className={INPUT + ' resize-none'} />
        </div>
      </section>

      {/* Contacto */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Contacto</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Ciudad *</label>
            <input name="city" required defaultValue={school.city} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Teléfono *</label>
            <input name="phone" required defaultValue={school.phone} className={INPUT} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Dirección *</label>
          <input name="address" required defaultValue={school.address} className={INPUT} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>WhatsApp *</label>
            <input name="whatsapp" required defaultValue={school.whatsapp} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Email *</label>
            <input name="email" type="email" required defaultValue={school.email} className={INPUT} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Sitio web</label>
          <input name="website" type="url" defaultValue={school.website ?? ''} placeholder="https://..." className={INPUT} />
        </div>
      </section>

      {/* Redes sociales */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Redes sociales</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(['instagram', 'facebook', 'tiktok', 'youtube'] as const).map((net) => (
            <div key={net}>
              <label className={LABEL}>{net.charAt(0).toUpperCase() + net.slice(1)}</label>
              <input name={net} defaultValue={(school as unknown as Record<string, string | null>)[net] ?? ''} className={INPUT} />
            </div>
          ))}
        </div>
      </section>

      {/* Horarios */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Horarios</h3>
        <div>
          <label className={LABEL}>Horario general</label>
          <textarea
            name="general_schedule"
            rows={3}
            defaultValue={school.general_schedule ?? ''}
            placeholder="Ej: Lunes a viernes de 7am–9pm · Sábados 8am–6pm · Domingos cerrado"
            className={INPUT + ' resize-none'}
          />
          <p className="mt-1 text-xs text-neutral-400">
            Se muestra en la pestaña "Contacto" del perfil público de la escuela.
          </p>
        </div>
      </section>

      {/* CTAs y formulario de leads */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Formulario de contacto</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>CTA principal</label>
            <input name="primary_cta_label" defaultValue={school.primary_cta_label ?? ''} placeholder="Solicitar información" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>CTA secundario</label>
            <input name="secondary_cta_label" defaultValue={school.secondary_cta_label ?? ''} placeholder="Clase de prueba" className={INPUT} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Título del formulario</label>
          <input name="lead_form_title" defaultValue={school.lead_form_title ?? ''} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Descripción del formulario</label>
          <textarea name="lead_form_description" rows={2} defaultValue={school.lead_form_description ?? ''} className={INPUT + ' resize-none'} />
        </div>
        <div>
          <label className={LABEL}>Mensaje clase de prueba</label>
          <textarea name="trial_class_message" rows={2} defaultValue={school.trial_class_message ?? ''} className={INPUT + ' resize-none'} />
        </div>
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-60 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        {isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
        {isPending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
