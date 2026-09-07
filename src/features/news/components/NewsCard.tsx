import Link from 'next/link'
import type { Route } from 'next'
import { MessageCircle, PlayCircle, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { newsCoverUrl } from '../server/news.server'
import type { NewsArticle } from '../types'

const scopeLabels: Record<NewsArticle['scope'], string> = {
  local: 'Local',
  regional: 'Regional',
  national: 'Nacional',
  international: 'Internacional',
}

function relativeDate(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000))
  if (minutes < 60) return `Hace ${minutes || 1} min`
  if (minutes < 1_440) return `Hace ${Math.round(minutes / 60)} h`
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value))
}

export function NewsCard({ article, priority = false }: { article: NewsArticle; priority?: boolean }) {
  const coverUrl = newsCoverUrl(article.coverCfImageId)
  const href = `/noticias/${article.slug}` as Route
  return (
    <article className={cn('group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-colors hover:border-primary-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700', priority && 'sm:grid sm:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)]')}>
      {coverUrl ? (
        <Link href={href} className={cn('relative block aspect-[16/9] overflow-hidden bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 dark:bg-neutral-800', priority && 'sm:aspect-auto sm:min-h-72')}>
          <img src={coverUrl} alt={article.title} className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025]" loading={priority ? 'eager' : 'lazy'} />
          {article.videoStreamUid && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-neutral-950/80 px-2.5 py-1.5 text-xs font-semibold text-white"><PlayCircle className="size-4" aria-hidden="true" /> Video</span>}
        </Link>
      ) : (
        <Link href={href} aria-label={`Leer ${article.title}`} className={cn('flex aspect-[16/9] items-end bg-primary-900 p-5 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400', priority && 'sm:aspect-auto sm:min-h-72')}>
          <span className="text-sm font-bold tracking-wide">Yebaam <span className="font-normal text-primary-200">Noticias</span></span>
        </Link>
      )}
      <div className={cn('p-5', priority && 'sm:flex sm:flex-col sm:justify-center sm:p-7')}>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="rounded-md bg-primary-50 px-2.5 py-1 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">{article.section.name}</span>
          <span className="text-neutral-500">{scopeLabels[article.scope]}</span>
          {article.isSponsored && <span className="rounded-md bg-secondary-50 px-2.5 py-1 text-secondary-900 dark:bg-secondary-900/30 dark:text-secondary-200">Publicidad</span>}
        </div>
        <Link href={href} className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900">
          <h2 className={cn('font-bold leading-snug text-neutral-900 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-400', priority ? 'text-2xl tracking-[-0.025em]' : 'text-lg')}>{article.title}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{article.excerpt}</p>
        </Link>
        <p className="mt-4 text-xs leading-5 text-neutral-500 dark:text-neutral-400">Por {article.author.name}<br />{article.source.name} · {relativeDate(article.publishedAt)}</p>
        <div className="mt-4 flex gap-4 border-t border-neutral-100 pt-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1"><ThumbsUp className="size-3.5" /> {article.reactionCount}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" /> {article.commentCount}</span>
        </div>
      </div>
    </article>
  )
}
