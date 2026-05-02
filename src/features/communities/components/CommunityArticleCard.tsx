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
  const date = new Date(article.publishedAt).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:focus-visible:ring-offset-gray-900"
    >
      <div className="relative aspect-16/10 overflow-hidden bg-linear-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40">
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
            <NewspaperIcon className="h-14 w-14 text-blue-500/40 dark:text-blue-400/30" />
          </div>
        )}
        {article.tags.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {article.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-gray-800 shadow-sm backdrop-blur-sm dark:bg-gray-900/80 dark:text-gray-100"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {article.title}
        </h3>
        {article.subtitle && (
          <p className="line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {article.subtitle}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <div className="flex min-w-0 items-center gap-2">
            {article.author.avatar ? (
              <Image
                src={article.author.avatar}
                alt={article.author.name}
                width={24}
                height={24}
                className="rounded-full ring-2 ring-white dark:ring-gray-800"
                style={{ width: 24, height: 24 }}
                unoptimized
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-500 text-[10px] font-semibold text-white ring-2 ring-white dark:ring-gray-800">
                {article.author.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate font-medium text-gray-700 dark:text-gray-300">
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
