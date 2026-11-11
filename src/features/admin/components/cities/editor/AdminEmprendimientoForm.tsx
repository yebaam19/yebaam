'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadService } from '@/lib/service/upload.service'
import { cfImageUrl } from '@/lib/cloudflare'
import { EMPRENDIMIENTO_CATEGORIES } from '@/features/cities/data/emprendimientos'
import { primaryActionStyles } from '@/ui/primary-action-styles'
import { saveCityEmprendimiento } from '@/features/admin/actions/city-emprendimiento-editor.actions'
import { EMPRENDIMIENTO_FIELDS, type AdminEmprendimientoInput } from '@/features/admin/lib/city-emprendimiento-input'

interface Props {
  cityId: string
  initial?: AdminEmprendimientoInput
  onClose: () => void
}

export function AdminEmprendimientoForm({ cityId, initial, onClose }: Props) {
  const router = useRouter()
  const [id, setId] = useState(initial?.id ?? '')
  const [hero, setHero] = useState(initial?.hero_cf_image_id ?? null)
  const [ownerPhoto, setOwnerPhoto] = useState(initial?.owner_cf_image_id ?? null)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const busy = pending || uploading
  const inputClass = 'mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900'

  async function upload(file: File, owner: boolean) {
    setError('')
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
      setError('Selecciona una imagen de hasta 10 MB.'); return
    }
    setUploading(true)
    try {
      const uploaded = await uploadService.uploadImage(file, undefined, { source: 'city-emprendimiento' })
      if (owner) setOwnerPhoto(uploaded.id)
      else setHero(uploaded.id)
    } catch { setError('No se pudo subir la imagen. Inténtalo de nuevo.') }
    finally { setUploading(false) }
  }

  function submit(form: HTMLFormElement) {
    if (busy) return
    const values = new FormData(form)
    const stableId = id || crypto.randomUUID()
    setId(stableId)
    setError('')
    startTransition(async () => {
      try {
        const fields = Object.fromEntries(Object.keys(EMPRENDIMIENTO_FIELDS).map((key) => [key, String(values.get(key) ?? '')]))
        const result = await saveCityEmprendimiento({
          ...fields, id: stableId, city_id: cityId, category: String(values.get('category')),
          hero_cf_image_id: hero, owner_cf_image_id: ownerPhoto,
        } as AdminEmprendimientoInput)
        if (!result.ok) { setError('No se pudo guardar. Revisa los datos e inténtalo de nuevo.'); return }
        router.refresh()
        onClose()
      } catch { setError('No se pudo guardar. Puedes volver a intentarlo sin perder los datos.') }
    })
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); submit(event.currentTarget) }} className="space-y-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
      <h3 className="font-semibold">{initial ? 'Editar emprendimiento' : 'Agregar emprendimiento'}</h3>
      <p className="text-sm text-neutral-500">
        {initial ? 'La edición conserva el propietario, la galería y el estado actual.' : 'Se registra a tu nombre y queda pendiente. Después podrás aprobarlo desde la lista.'}
      </p>
      <fieldset disabled={busy} className="space-y-3 disabled:opacity-60">
        {Object.entries(EMPRENDIMIENTO_FIELDS).map(([key, field]) => (
          <label key={key} className="block text-sm font-medium">{field.label}
            {['story', 'short_description'].includes(key)
              ? <textarea name={key} required={key === 'short_description'} maxLength={field.max} rows={3} defaultValue={initial?.[key as keyof typeof EMPRENDIMIENTO_FIELDS]} className={inputClass} />
              : <input name={key} required={key === 'name'} maxLength={field.max} type={['phone', 'whatsapp'].includes(key) ? 'tel' : 'text'} defaultValue={initial?.[key as keyof typeof EMPRENDIMIENTO_FIELDS]} className={inputClass} />}
          </label>
        ))}
        <label className="block text-sm font-medium">Categoría
          <select name="category" defaultValue={initial?.category ?? 'otro'} className={inputClass}>
            {EMPRENDIMIENTO_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        {[{ label: 'Portada', value: hero, owner: false }, { label: 'Foto del emprendedor', value: ownerPhoto, owner: true }].map((photo) => (
          <div key={photo.label} className="space-y-2">
            <label className="block text-sm font-medium">{photo.label}
              <input type="file" accept="image/*" className="mt-1 block w-full" onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void upload(file, photo.owner)
                event.target.value = ''
              }} />
            </label>
            {photo.value && <>
              <img src={cfImageUrl(photo.value) ?? undefined} alt={photo.label} className="h-24 w-36 rounded-lg object-cover" />
              <button type="button" className="text-sm underline" onClick={() => photo.owner ? setOwnerPhoto(null) : setHero(null)}>Quitar imagen</button>
            </>}
          </div>
        ))}
        <div className="flex gap-3">
          <button type="submit" className={primaryActionStyles}>{pending ? 'Guardando…' : uploading ? 'Subiendo imagen…' : 'Guardar emprendimiento'}</button>
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={onClose}>Cancelar</button>
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
