'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { uploadService } from '@/lib/service/upload.service'
import { createNewsArticleAction, createNewsSourceAction } from '../actions/news.actions'
import type { NewsScope, NewsSection } from '../types'
import type { MyNewsSource } from '../server/news-author.server'

export function NewsComposer({ sections, sources, cities, eligible, newsEnabled, videosEnabled }: { sections: NewsSection[]; sources: MyNewsSource[]; cities: Array<{ id: string; label: string }>; eligible: boolean; newsEnabled: boolean; videosEnabled: boolean }) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sourceName, setSourceName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [sourceCityId, setSourceCityId] = useState('')
  const [creatingSource, setCreatingSource] = useState(false)
  const [scope, setScope] = useState<NewsScope>('local')

  async function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(null)
    const result = await createNewsSourceAction({ name: sourceName, websiteUrl, cityId: sourceCityId || null })
    setBusy(false)
    if (!result.ok) return setMessage(result.error)
    setSourceName(''); setWebsiteUrl(''); setSourceCityId(''); setCreatingSource(false); setMessage('Fuente enviada para autorización. Podrás publicar cuando sea aprobada.'); router.refresh()
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(null)
    const form = new FormData(event.currentTarget)
    try {
      const image = form.get('cover')
      const video = videosEnabled ? form.get('video') : null
      const coverCfImageId = image instanceof File && image.size ? (await uploadService.uploadImage(image)).id : null
      const videoStreamUid = video instanceof File && video.size ? (await uploadService.uploadVideo(video)).uid : null
      const result = await createNewsArticleAction({
        title: String(form.get('title') ?? ''), excerpt: String(form.get('excerpt') ?? ''), content: String(form.get('content') ?? ''),
        sectionId: String(form.get('sectionId') ?? ''), sourceId: String(form.get('sourceId') ?? ''), scope: String(form.get('scope') ?? 'local') as NewsScope,
        cityId: String(form.get('cityId') ?? '') || null, coverCfImageId, videoStreamUid,
        isSponsored: form.get('isSponsored') === 'on', aiDisclosure: form.get('aiDisclosure') === 'on',
      })
      if (!result.ok || !result.data) return setMessage(result.ok ? 'No se recibió el enlace de la noticia.' : result.error)
      router.push(`/noticias/${result.data.slug}` as Route)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo publicar la noticia.') }
    finally { setBusy(false) }
  }

  if (!newsEnabled) return <section className="mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"><h1 className="text-xl font-bold">Publicación temporalmente desactivada</h1><p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">Administración desactivó el módulo de noticias.</p></section>
  if (!eligible) return <section className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950"><h1 className="text-xl font-bold">Publicar noticias requiere un perfil profesional verificado</h1><p className="mt-2 text-sm leading-6">La responsabilidad editorial está vinculada a una identidad profesional vigente y a una fuente autorizada.</p></section>
  const approved = sources.filter((source) => source.status === 'approved')
  return <div className="mx-auto max-w-3xl px-4 py-8"><h1 className="text-3xl font-black">Publicar noticia</h1><p className="mt-2 text-neutral-500 dark:text-neutral-400">Tu nombre, fuente autorizada y alcance aparecerán junto a la publicación.</p>
    {!approved.length && <section className="mt-6 rounded-2xl border border-primary-200 bg-primary-50 p-5 text-primary-950"><h2 className="font-bold">Registra una fuente autorizada</h2><p className="mt-1 text-sm">La administración local revisa las fuentes de una ciudad; las fuentes generales las revisa la plataforma.</p><button type="button" onClick={() => setCreatingSource(!creatingSource)} className="mt-3 min-h-10 rounded-lg bg-primary-700 px-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">{creatingSource ? 'Cancelar' : 'Registrar fuente'}</button>{creatingSource && <form onSubmit={addSource} className="mt-4 grid gap-3"><label className="grid gap-1 text-sm font-semibold">Nombre<input required value={sourceName} onChange={(e) => setSourceName(e.target.value)} className="min-h-11 rounded-lg border border-primary-200 bg-white px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" /></label><label className="grid gap-1 text-sm font-semibold">Sitio web <span className="font-normal text-primary-800">(opcional)</span><input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="min-h-11 rounded-lg border border-primary-200 bg-white px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" /></label><label className="grid gap-1 text-sm font-semibold">Cobertura<select value={sourceCityId} onChange={(e) => setSourceCityId(e.target.value)} className="min-h-11 rounded-lg border border-primary-200 bg-white px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"><option value="">General, nacional o internacional</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.label}</option>)}</select></label><button disabled={busy} className="min-h-11 justify-self-start rounded-lg bg-primary-700 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50">{busy ? 'Enviando…' : 'Enviar para aprobación'}</button></form>}</section>}
    {!!approved.length && <form onSubmit={publish} className="mt-8 grid gap-5"><label className="grid gap-2 text-sm font-semibold">Título<input required name="title" maxLength={180} className="rounded-lg border p-3 font-normal" /></label><label className="grid gap-2 text-sm font-semibold">Resumen<input required name="excerpt" minLength={20} maxLength={500} className="rounded-lg border p-3 font-normal" /></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Fuente<select required name="sourceId" className="rounded-lg border p-3 font-normal">{approved.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</select></label><label className="grid gap-2 text-sm font-semibold">Sección<select required name="sectionId" className="rounded-lg border p-3 font-normal">{sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}</select></label><label className="grid gap-2 text-sm font-semibold">Alcance<select name="scope" value={scope} onChange={(event) => setScope(event.target.value as NewsScope)} className="rounded-lg border p-3 font-normal"><option value="local">Local</option><option value="regional">Regional</option><option value="national">Nacional</option><option value="international">Internacional</option></select></label><label className="grid gap-2 text-sm font-semibold">Ciudad<select name="cityId" required={scope === 'local' || scope === 'regional'} disabled={scope === 'national' || scope === 'international'} className="rounded-lg border p-3 font-normal disabled:bg-neutral-100 dark:disabled:bg-neutral-800"><option value="">Selecciona una ciudad</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.label}</option>)}</select></label></div><label className="grid gap-2 text-sm font-semibold">Imagen de portada<input name="cover" type="file" accept="image/*" className="font-normal" /></label>{videosEnabled ? <label className="grid gap-2 text-sm font-semibold">Video<input name="video" type="file" accept="video/*" className="font-normal" /></label> : <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">La carga de videos está desactivada por administración.</p>}<label className="grid gap-2 text-sm font-semibold">Contenido<textarea required name="content" minLength={80} rows={12} className="rounded-lg border p-3 font-normal" placeholder="Redacta la noticia. Incluye #Publicidad o #Patrocinio si corresponde." /></label><label className="flex gap-2 text-sm"><input name="isSponsored" type="checkbox" /> Es contenido patrocinado</label><label className="flex gap-2 text-sm"><input name="aiDisclosure" type="checkbox" /> Declaro que contiene IA generativa</label><button disabled={busy} className="rounded-lg bg-primary-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Publicando…' : 'Publicar noticia'}</button></form>}
    {message && <p role="status" className="mt-5 text-sm text-neutral-600 dark:text-neutral-300">{message}</p>}
  </div>
}
