import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeftIcon, ClockIcon } from '@/components/icons/heroicons-shim';
import type { CommunityArticle } from '@/features/communities/types/communityArticle.types';

interface CommunityArticleViewProps {
  communitySlug: string;
  article: CommunityArticle;
}

export function CommunityArticleView({ communitySlug, article }: CommunityArticleViewProps) {
  const date = new Date(article.publishedAt).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <article className="space-y-6">
      <Link
        href={`/feed/comunidades/${communitySlug}/articulos` as Route}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a artículos
      </Link>

      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="text-lg text-gray-600 dark:text-gray-400">{article.subtitle}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            {article.author.avatar && (
              <Image
                src={article.author.avatar}
                alt={article.author.name}
                width={28}
                height={28}
                className="rounded-full"
                unoptimized
              />
            )}
            <span className="font-medium text-gray-900 dark:text-white">{article.author.name}</span>
          </div>
          <span aria-hidden>•</span>
          <span>{date}</span>
          {article.readTime && (
            <>
              <span aria-hidden>•</span>
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                {article.readTime} min de lectura
              </span>
            </>
          )}
        </div>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {article.coverImageUrl && (
        <div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 1024px) 100vw, 800px"
            className="object-cover"
            unoptimized
            priority
          />
        </div>
      )}

      <div
        className="prose prose-lg max-w-none dark:prose-invert text-gray-900 dark:text-gray-100"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
