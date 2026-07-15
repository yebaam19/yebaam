'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { createSchool } from '../../actions/school.actions'

const INPUT = 'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
const LABEL = 'mb-1.5 block text-sm font-semibold text-neutral-700'

const CATEGORY_LABELS = [
  { value: 'MUSIC',             label: '🎵 Música' },
  { value: 'ARTS',              label: '🎨 Artes Plásticas' },
  { value: 'DANCE',             label: '💃 Danza' },
  { value: 'THEATER',           label: '🎭 Teatro' },
  { value: 'MULTIDISCIPLINARY', label: '✨ Multidisciplinario' },
]

const TYPE_LABELS = [
  { value: 'PRIVATE',   label: 'Privada' },
  { value: 'PUBLIC',    label: 'Pública' },
  { value: 'NON_PROFIT',label: 'Sin fines de lucro' },
  { value: 'COLLEGE',   label: 'Universitaria' },
]

export function CreateSchoolForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    // Basic client-side validation
    const next: Record<string, string> = {}
    if (!fd.get('name')) next.name = 'El nombre es obligatorio'
    if (!fd.get('slug')) next.slug = 'La URL es obligatoria'
    if (!fd.get('category')) next.category = 'Elige una categoría'
    if (!fd.get('description') || String(fd.get('description')).length < 10) next.description = 'Escribe una descripción de al menos 10 caracteres'
    if (!fd.get('city')) next.city = 'La ciudad es obligatoria'
    if (!fd.get('phone')) next.phone = 'El teléfono es obligatorio'
    if (!fd.get('whatsapp')) next.whatsapp = 'El WhatsApp es obligatorio'
    if (!fd.get('email')) next.email = 'El email es obligatorio'
    if (!fd.get('address')) next.address = 'La dirección es obligatoria'

    if (Object.keys(next).length > 0) {
      setErrors(next)
      const first = document.querySelector('[aria-invalid="true"]')
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setErrors({})

    startTransition(async () => {
      try {
        const school = await createSchool(fd)
        toast.success('¡Escuela registrada! Bienvenido al panel de administración.')
        router.push(`/escuelas/admin/${school.id}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al registrar la escuela')
      }
    })
  }

  function toSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100)
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slugInput = document.getElementById('school-slug') as HTMLInputElement
    if (slugInput && !slugInput.dataset.edited) {
      slugInput.value = toSlug(e.target.value)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Registrar escuela" className="space-y-8">

      {/* Categoría */}
      <section aria-labelledby="sec-category">
        <h2 id="sec-category" className="mb-4 text-base font-semibold text-neutral-900">
          ¿Qué tipo de escuela tienes?
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CATEGORY_LABELS.map(({ value, label }) => (
            <label key={value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 p-4 transition hover:border-primary-300 hover:bg-primary-50 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50">
              <input type="radio" name="category" value={value} className="accent-primary-700" required aria-invalid={!!errors.category} />
              <span className="text-sm font-medium text-neutral-800">{label}</span>
            </label>
          ))}
        </div>
        {errors.category && <p role="alert" className="mt-2 text-sm text-red-600">{errors.category}</p>}
      </section>

      <hr className="border-neutral-100" />

      {/* Info básica */}
      <section aria-labelledby="sec-basic">
        <h2 id="sec-basic" className="mb-4 text-base font-semibold text-neutral-900">Información básica</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="school-name" className={LABEL}>Nombre de la escuela *</label>
              <input id="school-name" name="name" required onChange={handleNameChange} placeholder="Ej. Academia de Música del Pacífico" aria-invalid={!!errors.name} className={[INPUT, errors.name ? 'border-red-300' : ''].join(' ')} />
              {errors.name && <p role="alert" className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="school-slug" className={LABEL}>URL de la escuela *</label>
              <input id="school-slug" name="slug" required pattern="[a-z0-9-]+" onInput={(e) => { (e.target as HTMLInputElement).dataset.edited = '1' }} placeholder="academia-musica-pacifico" aria-invalid={!!errors.slug} className={[INPUT, 'font-mono text-xs', errors.slug ? 'border-red-300' : ''].join(' ')} />
              {errors.slug && <p role="alert" className="mt-1 text-xs text-red-600">{errors.slug}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="school-type" className={LABEL}>Tipo de institución *</label>
            <select id="school-type" name="school_type" defaultValue="PRIVATE" required className={INPUT}>
              {TYPE_LABELS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="school-desc" className={LABEL}>Descripción *</label>
            <textarea id="school-desc" name="description" rows={4} required minLength={10} placeholder="Cuéntanos qué hace especial a tu escuela, su propuesta pedagógica y enfoque artístico…" aria-invalid={!!errors.description} className={[INPUT, 'resize-none', errors.description ? 'border-red-300' : ''].join(' ')} />
            {errors.description && <p role="alert" className="mt-1 text-xs text-red-600">{errors.description}</p>}
          </div>
        </div>
      </section>

      <hr className="border-neutral-100" />

      {/* Ubicación y contacto */}
      <section aria-labelledby="sec-contact">
        <h2 id="sec-contact" className="mb-4 text-base font-semibold text-neutral-900">Ubicación y contacto</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="school-city" className={LABEL}>Ciudad *</label>
              <input id="school-city" name="city" required placeholder="Ej. Cali" aria-invalid={!!errors.city} className={[INPUT, errors.city ? 'border-red-300' : ''].join(' ')} />
              {errors.city && <p role="alert" className="mt-1 text-xs text-red-600">{errors.city}</p>}
            </div>
            <div>
              <label htmlFor="school-phone" className={LABEL}>Teléfono *</label>
              <input id="school-phone" name="phone" type="tel" required placeholder="+57 300 000 0000" aria-invalid={!!errors.phone} className={[INPUT, errors.phone ? 'border-red-300' : ''].join(' ')} />
              {errors.phone && <p role="alert" className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="school-address" className={LABEL}>Dirección *</label>
            <input id="school-address" name="address" required placeholder="Ej. Calle 5 # 20-30, Barrio Los Álamos" aria-invalid={!!errors.address} className={[INPUT, errors.address ? 'border-red-300' : ''].join(' ')} />
            {errors.address && <p role="alert" className="mt-1 text-xs text-red-600">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="school-whatsapp" className={LABEL}>WhatsApp *</label>
              <input id="school-whatsapp" name="whatsapp" type="tel" required placeholder="+57 300 000 0000" aria-invalid={!!errors.whatsapp} className={[INPUT, errors.whatsapp ? 'border-red-300' : ''].join(' ')} />
              {errors.whatsapp && <p role="alert" className="mt-1 text-xs text-red-600">{errors.whatsapp}</p>}
            </div>
            <div>
              <label htmlFor="school-email" className={LABEL}>Email *</label>
              <input id="school-email" name="email" type="email" required placeholder="contacto@miacademia.com" aria-invalid={!!errors.email} className={[INPUT, errors.email ? 'border-red-300' : ''].join(' ')} />
              {errors.email && <p role="alert" className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className={[
            'w-full inline-flex items-center justify-center gap-2.5 rounded-2xl px-6 py-4',
            'bg-primary-700 text-sm font-semibold text-white shadow-sm',
            'transition hover:bg-primary-800',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 focus-visible:ring-offset-2',
            'disabled:cursor-wait disabled:opacity-60',
          ].join(' ')}
        >
          {isPending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
              Registrando escuela…
            </>
          ) : 'Registrar mi escuela →'}
        </button>
        <p className="mt-3 text-center text-xs text-neutral-400">
          Podrás añadir programas, instructores y fotos desde el panel de administración.
        </p>
      </div>
    </form>
  )
}
