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
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-900">
        {article.coverImageUrl ? (
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <NewspaperIcon className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {article.title}
        </h3>
        {article.subtitle && (
          <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{article.subtitle}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2 min-w-0">
            {article.author.avatar && (
              <Image
                src={article.author.avatar}
                alt={article.author.name}
                width={20}
                height={20}
                className="rounded-full"
                unoptimized
              />
            )}
            <span className="truncate">{article.author.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span>{date}</span>
            {article.readTime && (
              <span className="inline-flex items-center gap-0.5">
                <ClockIcon className="h-3 w-3" />
                {article.readTime} min
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
