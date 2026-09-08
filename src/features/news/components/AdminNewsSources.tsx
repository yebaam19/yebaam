'use client'

import { FormEvent, useState } from 'react'
import { uploadService } from '@/lib/service/upload.service'
import {
  createNewsAdAction,
  createNewsSectionAction,
  decideNewsReplicaAction,
  moderateNewsArticleAction,
  setNewsSourceStatusAction,
  updateNewsModuleSettingsAction,
} from '../actions/news.actions'
import type {
  AdminNewsAdSlot,
  AdminNewsArticle,
  AdminNewsReplica,
  AdminNewsSection,
  AdminNewsSource,
} from '../server/news-author.server'
import type { NewsModuleSettings } from '../types'

const fieldClassName =
  'min-h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100'
const labelClassName = 'grid gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200'
const sourceStatusLabels: Record<AdminNewsSource['status'], string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  suspended: 'Suspendida',
}
const sourceStatusClasses: Record<AdminNewsSource['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  suspended: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
}

interface AdminNewsSourcesProps {
  sources: AdminNewsSource[]
  articles: AdminNewsArticle[]
  replicas: AdminNewsReplica[]
  sections: AdminNewsSection[]
  adSlots: AdminNewsAdSlot[]
  settings: NewsModuleSettings
}

export function AdminNewsSources({ sources, articles, replicas, sections, adSlots, settings }: AdminNewsSourcesProps) {
  const [message, setMessage] = useState<string | null>(null)

  async function run(action: Promise<{ ok: boolean; error?: string }>, success: string) {
    const result = await action
    setMessage(result.ok ? success : result.error ?? 'No se pudo completar la operación.')
    if (result.ok) window.location.reload()
  }

  async function section(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await run(createNewsSectionAction({
      name: String(form.get('name')),
      slug: String(form.get('slug')),
      description: String(form.get('description') ?? ''),
    }), 'Sección creada.')
  }

  async function ad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const form = new FormData(event.currentTarget)
      const image = form.get('image')
      const imageCfImageId = image instanceof File && image.size
        ? (await uploadService.uploadImage(image, undefined, { source: 'news-ad' })).id
        : null
      await run(createNewsAdAction({
        slotId: String(form.get('slotId')),
        advertiserName: String(form.get('advertiserName')),
        headline: String(form.get('headline')),
        destinationUrl: String(form.get('destinationUrl')),
        imageCfImageId,
        startsAt: String(form.get('startsAt')),
        endsAt: String(form.get('endsAt')),
      }), 'Pauta creada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo subir la imagen de la pauta.')
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 p-5 dark:border-neutral-800">
          <h1 className="text-2xl font-bold">Fuentes de noticias</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Solo las fuentes aprobadas pueden publicar con identidad profesional verificada.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
              <tr><th className="p-3">Fuente</th><th className="p-3">Responsable</th><th className="p-3">Estado</th><th className="p-3">Acciones</th></tr>
            </thead>
            <tbody>
              {sources.map((source) => {
                const isApproved = source.status === 'approved'
                const nextStatus = isApproved ? 'suspended' : 'approved'
                const actionLabel = isApproved ? 'Suspender' : source.status === 'suspended' ? 'Reactivar' : 'Aprobar'
                const successMessage = isApproved ? 'Fuente suspendida.' : source.status === 'suspended' ? 'Fuente reactivada.' : 'Fuente aprobada.'
                return (
                  <tr key={source.id} className="border-t border-neutral-100 dark:border-neutral-800">
                    <td className="p-3 font-medium">{source.name}{source.websiteUrl && <a className="ml-2 text-xs text-sky-700 underline dark:text-sky-400" href={source.websiteUrl} target="_blank" rel="noreferrer">Sitio</a>}</td>
                    <td className="p-3">{source.ownerName}</td>
                    <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${sourceStatusClasses[source.status]}`}>{sourceStatusLabels[source.status]}</span></td>
                    <td className="p-3"><button type="button" onClick={() => run(setNewsSourceStatusAction({ sourceId: source.id, status: nextStatus }), successMessage)} className={`rounded px-2 py-1 text-xs font-semibold text-white ${isApproved ? 'bg-neutral-700' : 'bg-emerald-600'}`}>{actionLabel}</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-xl font-bold">Publicaciones</h2>
        <div className="mt-3 divide-y dark:divide-neutral-800">
          {articles.map((article) => (
            <div key={article.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div><p className="font-medium">{article.title}</p><p className="text-xs capitalize text-neutral-500 dark:text-neutral-400">{article.status} {article.isFeatured ? '· destacada' : ''}</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => run(moderateNewsArticleAction({ articleId: article.id, action: article.isFeatured ? 'unfeature' : 'feature' }), 'Publicación actualizada.')} className="rounded bg-sky-700 px-2 py-1 text-xs font-semibold text-white">{article.isFeatured ? 'Quitar destacada' : 'Destacar'}</button>{article.status !== 'removed' && <button type="button" onClick={() => run(moderateNewsArticleAction({ articleId: article.id, action: 'remove' }), 'Publicación retirada.')} className="rounded bg-rose-700 px-2 py-1 text-xs font-semibold text-white">Retirar</button>}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-xl font-bold">Réplicas pendientes</h2>
        {replicas.length ? replicas.map((replica) => (
          <div key={replica.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 py-3 text-sm dark:border-neutral-800">
            <span>{replica.articleTitle} · {replica.entityType} · {replica.entityId}</span>
            <span className="flex gap-2"><button type="button" onClick={() => run(decideNewsReplicaAction({ replicaId: replica.id, status: 'approved' }), 'Réplica aprobada.')} className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">Aprobar</button><button type="button" onClick={() => run(decideNewsReplicaAction({ replicaId: replica.id, status: 'rejected' }), 'Réplica rechazada.')} className="rounded bg-neutral-700 px-2 py-1 text-xs font-semibold text-white">Rechazar</button></span>
          </div>
        )) : <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No hay solicitudes pendientes.</p>}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={section} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xl font-bold">Agregar sección</h2>
          <div className="mt-3 grid gap-3">
            <label htmlFor="news-section-name" className={labelClassName}>Nombre<input id="news-section-name" required name="name" className={fieldClassName} /></label>
            <label htmlFor="news-section-slug" className={labelClassName}>Slug<input id="news-section-slug" required name="slug" className={fieldClassName} /></label>
            <label htmlFor="news-section-description" className={labelClassName}>Descripción <span className="font-normal text-neutral-500 dark:text-neutral-400">(opcional)</span><input id="news-section-description" name="description" className={fieldClassName} /></label>
            <button className="min-h-11 rounded-lg bg-sky-700 px-3 text-sm font-semibold text-white">Crear sección</button>
          </div>
          <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">{sections.length} secciones configuradas.</p>
        </form>

        <form onSubmit={ad} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xl font-bold">Nueva pauta</h2>
          <div className="mt-3 grid gap-3">
            <label htmlFor="news-ad-slot" className={labelClassName}>Ubicación<select id="news-ad-slot" required name="slotId" className={fieldClassName}>{adSlots.map((slot) => <option key={slot.id} value={slot.id}>{slot.label}</option>)}</select></label>
            <label htmlFor="news-ad-advertiser" className={labelClassName}>Anunciante<input id="news-ad-advertiser" required name="advertiserName" className={fieldClassName} /></label>
            <label htmlFor="news-ad-headline" className={labelClassName}>Titular<input id="news-ad-headline" required name="headline" className={fieldClassName} /></label>
            <label htmlFor="news-ad-destination" className={labelClassName}>URL de destino<input id="news-ad-destination" required type="url" name="destinationUrl" className={fieldClassName} /></label>
            <label htmlFor="news-ad-image" className={labelClassName}>Imagen de la pauta<input id="news-ad-image" name="image" type="file" accept="image/*" className={`${fieldClassName} py-2`} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label htmlFor="news-ad-start" className={labelClassName}>Inicio<input id="news-ad-start" required type="datetime-local" name="startsAt" className={fieldClassName} /></label>
              <label htmlFor="news-ad-end" className={labelClassName}>Fin<input id="news-ad-end" required type="datetime-local" name="endsAt" className={fieldClassName} /></label>
            </div>
            <button className="min-h-11 rounded-lg bg-sky-700 px-3 text-sm font-semibold text-white">Activar pauta</button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-xl font-bold">Módulos</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['newsEnabled', 'videosEnabled', 'weatherEnabled', 'trendsEnabled', 'adsEnabled'] as const).map((key) => <button type="button" key={key} onClick={() => run(updateNewsModuleSettingsAction({ [key]: !settings[key] }), 'Configuración guardada.')} className={`rounded border px-3 py-2 text-sm ${settings[key] ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400' : 'border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400'}`}>{key}: {settings[key] ? 'activo' : 'inactivo'}</button>)}
        </div>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">La configuración se conserva en Supabase y controla la portada.</p>
      </section>
      {message && <p className="text-sm" role="status">{message}</p>}
    </div>
  )
}
