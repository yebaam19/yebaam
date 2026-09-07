import Link from 'next/link'
import type { Route } from 'next'
import { ArrowLeft } from 'lucide-react'
import { sanitizeRichText } from '@/lib/html/sanitize-rich-text'
import { StreamVideo } from '@/components/media/StreamVideo'
import { NewsInteractions } from './NewsInteractions'
import { NewsReportForm } from './NewsReportForm'
import { NewsReplicaForm } from './NewsReplicaForm'
import { newsCoverUrl } from '../server/news.server'
import type { NewsArticle, NewsComment, NewsReplica, NewsReplicaEntity } from '../types'

const replicaLabels: Record<NewsReplica['entityType'], string> = {
  professional_profile: 'Perfil profesional',
  page: 'Página',
  organization: 'Organización',
}

const scopeLabels: Record<NewsArticle['scope'], string> = {
  local: 'Local',
  regional: 'Regional',
  national: 'Nacional',
  international: 'Internacional',
}

export function NewsArticleView({ article, comments, replicas = [], replicaEntities = [], videosEnabled = true }: { article: NewsArticle; comments: NewsComment[]; replicas?: NewsReplica[]; replicaEntities?: NewsReplicaEntity[]; videosEnabled?: boolean }) {
  const cover = newsCoverUrl(article.coverCfImageId)
  return <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <Link href="/noticias" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400 dark:hover:bg-primary-950"><ArrowLeft className="size-4" aria-hidden="true" /> Noticias</Link>
    <p className="mt-8 text-sm font-semibold text-primary-700 dark:text-primary-400">{article.section.name} · {scopeLabels[article.scope]}</p>
    <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{article.title}</h1>
    <p className="mt-5 text-lg leading-8 text-neutral-600 dark:text-neutral-300">{article.excerpt}</p>
    <p className="mt-5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">Por {article.author.username ? <Link href={`/feed/professional-profile/${article.author.username}`} className="rounded font-semibold text-neutral-800 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-neutral-200 dark:hover:text-primary-300">{article.author.name}</Link> : article.author.name} · Fuente: <Link href={`/noticias/fuentes/${article.source.id}`} className="rounded font-semibold text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400">{article.source.name}</Link> · {new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(article.publishedAt))}</p>
    {article.isSponsored && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">#Publicidad · Contenido patrocinado identificado.</p>}
    {article.aiDisclosure && <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100">Este contenido declara el uso de IA generativa.</p>}
    {cover && <div className="mt-8 overflow-hidden rounded-2xl"><img src={cover} alt={`Imagen principal de ${article.title}`} className="w-full object-cover" /></div>}
    {videosEnabled && article.videoStreamUid && <div className="mt-8 overflow-hidden rounded-2xl"><StreamVideo uid={article.videoStreamUid} title={article.title} /></div>}
    <NewsInteractions articleId={article.id} initialReactions={article.reactionCount} initialComments={article.commentCount} initialLiked={article.viewerLiked} initialSaved={article.viewerSaved} />
    <NewsReportForm articleId={article.id} />
    <NewsReplicaForm articleId={article.id} entities={replicaEntities} />
    {replicas.length > 0 && <section className="mt-6 border-y border-neutral-200 py-4 text-sm dark:border-neutral-800"><h2 className="font-semibold">Réplicas autorizadas</h2><p className="mt-1 text-neutral-500 dark:text-neutral-400">La plataforma validó estas entidades para replicar la noticia.</p><ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">{replicas.map((replica) => <li key={replica.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><span><span className="font-semibold">{replica.name}</span><span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">{replicaLabels[replica.entityType]}</span></span>{replica.href && <Link href={replica.href as Route} className="rounded text-xs font-semibold text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400">Ver entidad</Link>}</li>)}</ul></section>}
    <article className="prose prose-neutral mt-8 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeRichText(article.content ?? '') }} />
    <section className="mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-800"><h2 className="text-xl font-bold">Comentarios</h2>{comments.length ? <ul className="mt-5 divide-y divide-neutral-200 dark:divide-neutral-800">{comments.map((comment) => <li key={comment.id} className="py-5"><p className="text-sm font-semibold">{comment.author.name}</p><p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">{comment.content}</p></li>)}</ul> : <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">Sé la primera persona en comentar.</p>}</section>
  </div>
}
