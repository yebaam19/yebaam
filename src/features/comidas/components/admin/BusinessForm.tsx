'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createBusiness, updateBusiness } from '../../actions/business.actions'
import type { Business } from '../../types'
import { CategoryPicker } from './form/CategoryPicker'
import { SlugField } from './form/SlugField'
import { ContactSection, type ContactValues } from './form/ContactSection'
import { SocialSection, type SocialValues } from './form/SocialSection'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

const LABEL = 'mb-1.5 block text-sm font-medium text-neutral-700'
const INPUT =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 ' +
  'placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none ' +
  'focus:ring-2 focus:ring-primary-500/20 transition-shadow'
const INPUT_ERROR =
  'border-red-400 ring-2 ring-red-400/20 focus:border-red-400 focus:ring-red-400/20'
const DESC_MAX = 300

interface Props {
  business?: Business
}

export function BusinessForm({ business }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [name, setName] = useState(business?.name ?? '')
  const [slug, setSlug] = useState(business?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(!!business?.slug)
  const [category, setCategory] = useState(business?.category ?? '')
  const [description, setDescription] = useState(business?.description ?? '')
  const [city, setCity] = useState(business?.city ?? '')
  const [contact, setContact] = useState<ContactValues>({
    phone: business?.phone ?? '',
    whatsapp: business?.whatsapp ?? '',
    email: business?.email ?? '',
    website: business?.website ?? '',
  })
  const [social, setSocial] = useState<SocialValues>({
    instagram: business?.instagram ?? '',
    facebook: business?.facebook ?? '',
    tiktok: business?.tiktok ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleNameChange(value: string) {
    setName(value)
    if (!slugEdited) setSlug(toSlug(value))
  }

  function handleSlugChange(value: string) {
    setSlug(value)
    setSlugEdited(true)
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'El nombre es obligatorio'
    if (!slug.trim()) next.slug = 'La URL es obligatoria'
    if (!category) next.category = 'Elige una categoría para continuar'
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setTimeout(() => {
        document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return

    const fd = new FormData()
    fd.set('name', name.trim())
    fd.set('slug', slug.trim())
    fd.set('category', category)
    if (description.trim()) fd.set('description', description.trim())
    if (city.trim()) fd.set('city', city.trim())
    if (contact.phone.trim()) fd.set('phone', contact.phone.trim())
    if (contact.whatsapp.trim()) fd.set('whatsapp', contact.whatsapp.trim())
    if (contact.email.trim()) fd.set('email', contact.email.trim())
    if (contact.website.trim()) fd.set('website', contact.website.trim())
    if (social.instagram.trim()) fd.set('instagram', social.instagram.trim())
    if (social.facebook.trim()) fd.set('facebook', social.facebook.trim())
    if (social.tiktok.trim()) fd.set('tiktok', social.tiktok.trim())

    startTransition(async () => {
      try {
        if (business) {
          await updateBusiness(business.id, fd)
          toast.success('Negocio actualizado')
        } else {
          const result = await createBusiness(fd)
          toast.success('¡Negocio creado! Bienvenido al dashboard.')
          router.push(`/negocios/admin/${result.id}`)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={business ? 'Editar negocio' : 'Registrar negocio'}
      className="space-y-8"
    >
      {/* 1 — Categoría */}
      <section aria-labelledby="sec-category">
        <header className="mb-4">
          <h2 id="sec-category" className="text-base font-semibold text-neutral-900">
            ¿Qué tipo de negocio tienes?
            <span className="ml-1 text-red-500" aria-hidden="true">*</span>
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">Elige la categoría que mejor describe tu local.</p>
        </header>
        <CategoryPicker value={category} onChange={setCategory} error={errors.category} />
      </section>

      <hr className="border-neutral-100" />

      {/* 2 — Información básica */}
      <section aria-labelledby="sec-basic">
        <h2 id="sec-basic" className="mb-4 text-base font-semibold text-neutral-900">
          Información básica
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="biz-name" className={LABEL}>
              Nombre del negocio
              <span className="ml-1 text-red-500" aria-label="requerido">*</span>
            </label>
            <input
              id="biz-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej. Café del Parque"
              required
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={[INPUT, errors.name ? INPUT_ERROR : ''].join(' ')}
            />
            {errors.name && (
              <p id="name-error" role="alert" className="mt-1 flex items-center gap-1.5 text-xs text-red-500">
                <span aria-hidden>⚠</span> {errors.name}
              </p>
            )}
          </div>

          <SlugField slug={slug} onSlugChange={handleSlugChange} error={errors.slug} />
        </div>
      </section>

      <hr className="border-neutral-100" />

      {/* 3 — Descripción + ciudad */}
      <section aria-labelledby="sec-desc">
        <header className="mb-4">
          <h2 id="sec-desc" className="text-base font-semibold text-neutral-900">
            Descripción <span className="text-sm font-normal text-neutral-400">(opcional)</span>
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">Cuéntales a tus clientes qué hace especial tu negocio.</p>
        </header>
        <div className="space-y-4">
          <div>
            <label htmlFor="biz-description" className={LABEL}>Descripción breve</label>
            <div className="relative">
              <textarea
                id="biz-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
                placeholder="Describe tu negocio en pocas palabras…"
                maxLength={DESC_MAX}
                aria-describedby="desc-counter"
                className={[INPUT, 'resize-none pr-14'].join(' ')}
              />
              <span
                id="desc-counter"
                aria-live="polite"
                aria-label={`${description.length} de ${DESC_MAX} caracteres`}
                className={[
                  'pointer-events-none absolute bottom-3 right-3 text-xs tabular-nums',
                  description.length > DESC_MAX * 0.9 ? 'text-amber-500 font-medium' : 'text-neutral-400',
                ].join(' ')}
              >
                {description.length}/{DESC_MAX}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="biz-city" className={LABEL}>Ciudad</label>
            <input
              id="biz-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej. Bogotá"
              autoComplete="address-level2"
              className={INPUT}
            />
          </div>
        </div>
      </section>

      <hr className="border-neutral-100" />

      {/* 4 — Contacto */}
      <section aria-labelledby="sec-contact">
        <header className="mb-4">
          <h2 id="sec-contact" className="text-base font-semibold text-neutral-900">
            Contacto <span className="text-sm font-normal text-neutral-400">(opcional)</span>
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">Cómo te encuentran y contactan tus clientes.</p>
        </header>
        <ContactSection
          values={contact}
          onChange={(field, value) => setContact((c) => ({ ...c, [field]: value }))}
        />
      </section>

      <hr className="border-neutral-100" />

      {/* 5 — Redes sociales (colapsable) */}
      <section>
        <SocialSection
          values={social}
          onChange={(field, value) => setSocial((s) => ({ ...s, [field]: value }))}
        />
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
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
              {business ? 'Guardando…' : 'Creando tu negocio…'}
            </>
          ) : (
            business ? 'Guardar cambios' : 'Crear mi negocio →'
          )}
        </button>

        {!business && (
          <p className="mt-3 text-center text-xs text-neutral-400">
            Podrás añadir fotos, productos y promociones desde el dashboard.
          </p>
        )}
      </div>
    </form>
  )
}
