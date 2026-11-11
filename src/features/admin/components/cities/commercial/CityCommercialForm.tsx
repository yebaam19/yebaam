'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveCityBusiness, saveCityService } from '@/features/admin/actions/city-commercial.actions'
import type { CityCommercialRow, CommercialKind } from '@/features/admin/lib/city-commercial'
import { primaryActionStyles } from '@/ui/primary-action-styles'

interface Props {
  cityId: string; kind: CommercialKind; categories: { id: string; name: string }[]
  entry?: CityCommercialRow
}
const field = 'mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700'

export function CityCommercialForm({ cityId, kind, categories, entry }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [id, setId] = useState(entry?.id ?? '')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const business = kind === 'businesses'
  function submit(form: HTMLFormElement) {
    const formData = new FormData(form)
    const value = (key: string) => String(formData.get(key) ?? '')
    const stableId = id || crypto.randomUUID()
    setId(stableId)
    setError(''); setNotice('')
    startTransition(async () => {
      try {
        const base = { id: stableId, cityId, name: value('name'), description: value('description'),
          address: value('address'), phone: value('phone'), category: value('category') }
        const result = business ? await saveCityBusiness({ ...base,
          slug: entry?.slug ?? `${value('name').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'negocio'}-${stableId.slice(0, 8)}`,
          legalName: value('legalName'), taxId: value('taxId'), pricesIncludeTax: formData.has('pricesIncludeTax'), active: formData.has('active'),
        }) : await saveCityService({ ...base, username: value('username'), visibility: value('visibility') === 'PUBLIC' ? 'PUBLIC' : value('visibility') === 'LIMITED' ? 'LIMITED' : 'PRIVATE' })
        if (!result.ok) { setError(result.error); return }
        setNotice(business ? 'Negocio guardado.' : 'Servicio guardado. El propietario puede revisar su perfil y aceptar la publicación.')
        if (!entry) { form.reset(); setId('') }
        router.refresh()
      } catch { setError('No se pudo guardar. Revisa tu conexión y vuelve a intentar.') }
    })
  }
  return <form onSubmit={(e) => { e.preventDefault(); submit(e.currentTarget) }} className="space-y-3">
    <fieldset disabled={pending} className="space-y-3 disabled:opacity-60">
      {!business && !entry && <label className="block text-sm">Usuario del prestador (sin @)
        <input name="username" required maxLength={80} className={field} autoComplete="off" />
        <span className="text-xs text-neutral-500">El borrador será privado. El prestador deberá revisarlo y aceptar personalmente la publicación.</span>
      </label>}
      <label className="block text-sm">Nombre<input name="name" required minLength={2} maxLength={120} defaultValue={entry?.name} className={field} /></label>
      <label className="block text-sm">Categoría<select name="category" required defaultValue={entry?.category ?? ''} className={field}>
        <option value="">Selecciona una categoría</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></label>
      <label className="block text-sm">Descripción<textarea name="description" rows={3} maxLength={4000} defaultValue={entry?.description ?? ''} className={field} /></label>
      <label className="block text-sm">Dirección comercial<input name="address" maxLength={500} defaultValue={entry?.address ?? ''} className={field} /></label>
      <label className="block text-sm">Teléfono de atención<input name="phone" type="tel" maxLength={40} defaultValue={entry?.phone ?? ''} className={field} /></label>
      {business ? <>
        <label className="block text-sm">Razón social<input name="legalName" maxLength={150} defaultValue={entry?.legal_name ?? ''} className={field} /></label>
        <label className="block text-sm">NIT / identificación fiscal<input name="taxId" maxLength={80} defaultValue={entry?.tax_id ?? ''} className={field} /></label>
        <label className="flex items-start gap-2 text-sm"><input name="pricesIncludeTax" type="checkbox" defaultChecked={entry?.prices_include_tax} />Los precios publicados incluyen los impuestos aplicables.</label>
        <label className="flex items-start gap-2 text-sm"><input name="active" type="checkbox" defaultChecked={entry?.is_active} />Publicar en la ciudad y en Negocios</label>
        {!entry && <p className="text-xs text-neutral-500">Tu cuenta quedará como administradora del negocio. Puedes guardarlo sin publicar y completar sus imágenes y productos desde Negocios.</p>}
      </> : <label className="block text-sm">Visibilidad<select name="visibility" defaultValue={entry?.visibility ?? 'PRIVATE'} className={field}>
        <option value="PRIVATE">Privado</option>
        {entry?.visibility === 'LIMITED' && <option value="LIMITED">Limitado</option>}
        {entry?.visibility === 'PUBLIC' && <option value="PUBLIC">Público (autorizado por el propietario)</option>}
      </select></label>}
      <button type="submit" className={primaryActionStyles} disabled={pending}>{pending ? 'Guardando…' : entry ? 'Guardar cambios' : business ? 'Agregar negocio' : 'Crear borrador profesional'}</button>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {notice && <p role="status" className="text-sm text-primary-700">{notice}</p>}
  </form>
}
