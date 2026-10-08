import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ClockIcon, NewspaperIcon } from '@/components/icons/heroicons-shim';
import type { CommunityArticleSummary } from '@/features/communities/types/communityArticle.types';

interface CommunityArticleCardProps {
  communitySlug: string;
  article: CommunityArticleSummary;
}

export function CommunityArticleCard({ communitySlug, article }: CommunityArticleCardProps) {
  const href = `/feed/comunidades/${communitySlug}/articulos/${article.slug}` as Route;
  const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) : 'Borrador';

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors hover:border-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-300"
    >
      <div className="relative aspect-16/10 overflow-hidden bg-secondary-100 dark:bg-primary-950">
        {article.coverImageUrl ? (
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <NewspaperIcon className="h-12 w-12 text-primary-800/60 dark:text-primary-300/70" />
          </div>
        )}
        {article.tags.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {article.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-primary-900 dark:bg-primary-900 dark:text-white"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {!article.isPublished && <span className="text-xs font-semibold text-secondary-900 dark:text-secondary-200">Borrador privado</span>}
        {article.category && <span className="text-xs font-medium text-primary-800 dark:text-primary-300">{article.category}</span>}
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-primary-800 dark:text-white dark:group-hover:text-primary-300">
          {article.title}
        </h3>
        {article.subtitle && (
            <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            {article.subtitle}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-neutral-200 pt-3 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
          <div className="flex min-w-0 items-center gap-2">
            {article.author.avatar ? (
              <Image
                src={article.author.avatar}
                alt={article.author.name}
                width={24}
                height={24}
                className="rounded-full"
                style={{ width: 24, height: 24 }}
                unoptimized
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-800 text-[10px] font-semibold text-white">
                {article.author.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate font-medium text-neutral-700 dark:text-neutral-200">
              {article.author.name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span>{date}</span>
            {article.readTime && (
              <>
                <span aria-hidden className="text-gray-300 dark:text-gray-600">
                  •
                </span>
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  {article.readTime} min
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
