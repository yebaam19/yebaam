'use client'

import { uploadService } from '@/lib/service/upload.service'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { createNewsArticleAction } from '../actions/news.actions'
import type { MyNewsSource } from '../server/news-author.server'
import type { NewsScope, NewsSection } from '../types'

interface NewsArticleFormProps {
  sections: NewsSection[]
  sources: MyNewsSource[]
  cities: Array<{ id: string; label: string }>
  videosEnabled: boolean
}

export function NewsArticleForm({ sections, sources, cities, videosEnabled }: NewsArticleFormProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [scope, setScope] = useState<NewsScope>('local')

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    const form = new FormData(event.currentTarget)
    try {
      const image = form.get('cover')
      const video = videosEnabled ? form.get('video') : null
      const coverCfImageId = image instanceof File && image.size ? (await uploadService.uploadImage(image)).id : null
      const videoStreamUid = video instanceof File && video.size ? (await uploadService.uploadVideo(video)).uid : null
      const result = await createNewsArticleAction({
        title: String(form.get('title') ?? ''),
        excerpt: String(form.get('excerpt') ?? ''),
        content: String(form.get('content') ?? ''),
        sectionId: String(form.get('sectionId') ?? ''),
        sourceId: String(form.get('sourceId') ?? ''),
        scope: String(form.get('scope') ?? 'local') as NewsScope,
        cityId: String(form.get('cityId') ?? '') || null,
        coverCfImageId,
        videoStreamUid,
        isSponsored: form.get('isSponsored') === 'on',
        aiDisclosure: form.get('aiDisclosure') === 'on',
      })
      if (!result.ok || !result.data) {
        setMessage(result.ok ? 'No se recibió el enlace de la noticia.' : result.error)
        return
      }
      router.push(`/noticias/${result.data.slug}` as Route)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo publicar la noticia.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <form onSubmit={publish} className="mt-8 grid gap-5">
        <label className="grid gap-2 text-sm font-semibold">
          Título
          <input required name="title" maxLength={180} className="rounded-lg border p-3 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Resumen
          <input required name="excerpt" minLength={20} maxLength={500} className="rounded-lg border p-3 font-normal" />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Fuente
            <select required name="sourceId" className="rounded-lg border p-3 font-normal">
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Sección
            <select required name="sectionId" className="rounded-lg border p-3 font-normal">
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Alcance
            <select
              name="scope"
              value={scope}
              onChange={(event) => setScope(event.target.value as NewsScope)}
              className="rounded-lg border p-3 font-normal"
            >
              <option value="local">Local</option>
              <option value="regional">Regional</option>
              <option value="national">Nacional</option>
              <option value="international">Internacional</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Ciudad
            <select
              name="cityId"
              required={scope === 'local' || scope === 'regional'}
              disabled={scope === 'national' || scope === 'international'}
              className="rounded-lg border p-3 font-normal disabled:bg-neutral-100 dark:disabled:bg-neutral-800"
            >
              <option value="">Selecciona una ciudad</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Imagen de portada
          <input name="cover" type="file" accept="image/*" className="font-normal" />
        </label>
        {videosEnabled ? (
          <label className="grid gap-2 text-sm font-semibold">
            Video
            <input name="video" type="file" accept="video/*" className="font-normal" />
          </label>
        ) : (
          <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            La carga de videos está desactivada por administración.
          </p>
        )}
        <label className="grid gap-2 text-sm font-semibold">
          Contenido
          <textarea
            required
            name="content"
            minLength={80}
            rows={12}
            className="rounded-lg border p-3 font-normal"
            placeholder="Redacta la noticia. Incluye #Publicidad o #Patrocinio si corresponde."
          />
        </label>
        <label className="flex gap-2 text-sm">
          <input name="isSponsored" type="checkbox" /> Es contenido patrocinado
        </label>
        <label className="flex gap-2 text-sm">
          <input name="aiDisclosure" type="checkbox" /> Declaro que contiene IA generativa
        </label>
        <button
          disabled={busy}
          className="rounded-lg bg-primary-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Publicando…' : 'Publicar noticia'}
        </button>
      </form>
      {message && (
        <p role="status" className="mt-5 text-sm text-neutral-600 dark:text-neutral-300">
          {message}
        </p>
      )}
    </>
  )
}
