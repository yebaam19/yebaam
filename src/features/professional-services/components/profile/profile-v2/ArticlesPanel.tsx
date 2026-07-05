import Image from 'next/image'
import Link from 'next/link'
import { ClockIcon, NewspaperIcon } from '@/components/icons/heroicons-shim'
import { imageUrl } from '@/lib/media/urls'
import type { OwnerArticleCard } from '../../../server/owner-content.server'

interface ArticlesPanelProps {
  articles: OwnerArticleCard[]
}

/**
 * Panel "Artículos" del perfil: grilla de tarjetas con los artículos públicos
 * del dueño (leídos en el servidor vía `getOwnerPublishedArticles`). Cada
 * tarjeta enlaza al detalle `/feed/article/[articleId]`.
 */
export function ArticlesPanel({ articles }: ArticlesPanelProps) {
  if (articles.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
        <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Artículos</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Este profesional aún no ha publicado artículos.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {articles.map((article) => (
        <ArticleCardCompact key={article.id} article={article} />
      ))}
    </div>
  )
}

function coverUrl(cfImageId: string | null): string | null {
  if (!cfImageId) return null
  try {
    return imageUrl(cfImageId, 'thumbnail')
  } catch {
    return null
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ArticleCardCompact({ article }: { article: OwnerArticleCard }) {
  const cover = coverUrl(article.cfImageId)

  return (
    <Link
      href={`/feed/article/${article.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-800"
    >
      <div className="relative aspect-16/9 w-full bg-neutral-200 dark:bg-neutral-700">
        {cover ? (
          <Image
            src={cover}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <NewspaperIcon className="h-10 w-10 text-neutral-400 dark:text-neutral-500" />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 font-semibold text-neutral-900 dark:text-neutral-100">
          {article.title}
        </h3>
        {article.subtitle && (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
            {article.subtitle}
          </p>
        )}
        <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          {article.readTime != null && article.readTime > 0 && (
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              {article.readTime} min de lectura
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
