'use client'

import Image from 'next/image'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadService } from '@/lib/service/upload.service'
import { cfImageUrl } from '@/lib/cloudflare'
import { saveCityEvent } from '@/features/admin/actions/city-events.actions'
import { EVENT_STATUSES, eventStatusLabels, type CityEvent } from '@/features/cities/events/types'
import { primaryActionStyles } from '@/ui/primary-action-styles'

function localInput(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function CityEventForm({ cityId, event, onClose }: { cityId: string; event?: CityEvent; onClose?: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [image, setImage] = useState(event?.cover_cf_image_id ?? null)
  const [draftId, setDraftId] = useState(event?.id ?? '')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [dates, setDates] = useState({ start: '', end: '', zone: '' })
  useEffect(() => {
    setDates({ start: localInput(event?.starts_at), end: localInput(event?.ends_at), zone: Intl.DateTimeFormat().resolvedOptions().timeZone })
  }, [event?.starts_at, event?.ends_at])
  const busy = pending || uploading || !dates.zone
  const field = 'mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900'
  const preview = cfImageUrl(image)

  async function upload(file: File) {
    setError('')
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { setError('Elige una imagen de hasta 10 MB.'); return }
    setUploading(true)
    try { setImage((await uploadService.uploadImage(file, undefined, { source: 'city-event' })).id) }
    catch { setError('No se pudo subir la imagen. Inténtalo de nuevo.') }
    finally { setUploading(false) }
  }

  function submit(form: HTMLFormElement) {
    const data = new FormData(form)
    const status = String(data.get('status')) as CityEvent['status']
    if (status === 'archived' && event?.status !== 'archived' && !window.confirm('¿Archivar este evento y retirarlo del calendario público?')) return
    if (localInput(new Date(dates.start).toISOString()) !== dates.start || localInput(new Date(dates.end).toISOString()) !== dates.end) {
      setError('La hora no existe en la zona de tu dispositivo por un cambio de horario. Elige otra hora.'); return
    }
    const id = draftId || crypto.randomUUID()
    setDraftId(id)
    setError(''); setNotice('')
    startTransition(async () => {
      try {
        const result = await saveCityEvent({
          id, city_id: cityId, status, cover_cf_image_id: image,
          title: String(data.get('title') ?? ''), description: String(data.get('description') ?? ''),
          venue: String(data.get('venue') ?? ''), website: String(data.get('website') ?? ''),
          starts_at: new Date(dates.start).toISOString(), ends_at: new Date(dates.end).toISOString(),
          time_zone: String(data.get('time_zone') ?? ''),
        })
        if (!result.ok) { setError(result.error); return }
        router.refresh()
        if (event) onClose?.()
        else { form.reset(); setImage(null); setDraftId(''); setDates({ ...dates, start: '', end: '' }); setNotice('Evento guardado.') }
      } catch { setError('No se pudo guardar. Revisa las fechas e inténtalo de nuevo.') }
    })
  }

  return <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(e.currentTarget) }}>
    <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
      <label className="block text-sm">Título<input required name="title" maxLength={150} defaultValue={event?.title} className={field} /></label>
      <label className="block text-sm">Descripción<textarea name="description" maxLength={4000} rows={4} defaultValue={event?.description} className={field} /></label>
      <label className="block text-sm">Lugar público o recinto<input required name="venue" maxLength={300} defaultValue={event?.venue} className={field} /></label>
      <p className="text-xs text-neutral-500">Introduce las horas en la zona de tu dispositivo: {dates.zone || 'cargando…'}. Se conservará el instante al mostrarlas en la zona del evento.</p>
      <label className="block text-sm">Inicio<input required type="datetime-local" value={dates.start} onChange={(e) => setDates({ ...dates, start: e.target.value })} className={field} /></label>
      <label className="block text-sm">Finalización<input required type="datetime-local" value={dates.end} onChange={(e) => setDates({ ...dates, end: e.target.value })} className={field} /></label>
      <label className="block text-sm">Zona horaria del evento<input required name="time_zone" key={dates.zone} defaultValue={event?.time_zone ?? dates.zone} placeholder="America/Chicago, Europe/Madrid…" className={field} /></label>
      <label className="block text-sm">Enlace de información<input type="url" name="website" maxLength={2048} defaultValue={event?.website} className={field} /></label>
      <label className="block text-sm">Portada<input type="file" accept="image/*" className="mt-2 block w-full text-sm" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = '' }} /></label>
      {preview && <div className="flex items-center gap-3"><Image src={preview} alt="" width={160} height={100} unoptimized className="rounded-lg object-cover" /><button type="button" onClick={() => setImage(null)} className="text-sm underline">Quitar portada</button></div>}
      <label className="block text-sm">Estado<select name="status" defaultValue={event?.status ?? 'draft'} className={field}>{EVENT_STATUSES.map((status) => <option key={status} value={status}>{eventStatusLabels[status]}</option>)}</select></label>
      <p className="text-xs text-neutral-500">Solo los eventos publicados aparecen en la ciudad. Archivar conserva el historial y permite recuperarlos.</p>
      <div className="flex gap-3"><button type="submit" className={`${primaryActionStyles} px-4`}>{pending ? 'Guardando…' : 'Guardar evento'}</button>{onClose && <button type="button" onClick={onClose}>Cancelar</button>}</div>
    </fieldset>
    {uploading && <p role="status">Subiendo portada…</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {notice && <p role="status" className="text-sm text-primary-700">{notice}</p>}
  </form>
}

export function CityEventEditor({ event }: { event: CityEvent }) {
  const [editing, setEditing] = useState(false)
  return <li className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
    <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{event.title}</h3><p className="text-xs text-neutral-500">{eventStatusLabels[event.status]}</p></div>
      <button type="button" className="min-h-10 px-3 text-sm underline" onClick={() => setEditing(!editing)}>{editing ? 'Cerrar' : 'Editar'}</button></div>
    {editing && <div className="mt-4"><CityEventForm cityId={event.city_id} event={event} onClose={() => setEditing(false)} /></div>}
  </li>
}
