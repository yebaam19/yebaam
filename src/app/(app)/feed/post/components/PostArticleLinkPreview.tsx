'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ClockIcon, NewspaperIcon } from '@/components/icons/heroicons-shim';
import {
  getCommunityArticlePreview,
  type CommunityArticlePreview,
} from '@/features/communities/actions/communityArticles.actions';

/**
 * Matches a community article URL with or without origin:
 *   /feed/comunidades/<community-slug>/articulos/<article-slug>
 * Trailing path segments and query strings are tolerated and ignored.
 */
const ARTICLE_URL_RE =
  /(?:https?:\/\/[^\s]+)?\/feed\/comunidades\/([a-z0-9-]+)\/articulos\/([a-z0-9-]+)(?=$|[\s/?#])/i;

export interface ParsedArticleLink {
  communitySlug: string;
  articleSlug: string;
  matchedUrl: string;
}

export function parseFirstArticleLink(text: string | null | undefined): ParsedArticleLink | null {
  if (!text) return null;
  const m = text.match(ARTICLE_URL_RE);
  if (!m) return null;
  return {
    communitySlug: m[1].toLowerCase(),
    articleSlug: m[2].toLowerCase(),
    matchedUrl: m[0],
  };
}

interface PostArticleLinkPreviewProps {
  communitySlug: string;
  articleSlug: string;
}

export function PostArticleLinkPreview({
  communitySlug,
  articleSlug,
}: PostArticleLinkPreviewProps) {
  const [preview, setPreview] = useState<CommunityArticlePreview | null | 'loading' | 'error'>(
    'loading',
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getCommunityArticlePreview(communitySlug, articleSlug);
        if (!cancelled) setPreview(result);
      } catch {
        if (!cancelled) setPreview('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [communitySlug, articleSlug]);

  if (preview === 'loading') {
    return (
      <div className="mt-3 h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40" />
    );
  }

  if (!preview || preview === 'error') {
    // Fallback: render as a plain styled link so users still get something useful.
    return (
      <Link
        href={`/feed/comunidades/${communitySlug}/articulos/${articleSlug}` as Route}
        className="mt-3 block break-all rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-blue-600 hover:underline dark:border-gray-700 dark:bg-gray-800/40 dark:text-blue-400"
      >
        Abrir artículo
      </Link>
    );
  }

  return (
    <Link
      href={preview.href as Route}
      className="group mt-3 flex overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700"
    >
      <div className="relative aspect-square w-28 shrink-0 bg-linear-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 sm:w-36">
        {preview.coverImageUrl ? (
          <Image
            src={preview.coverImageUrl}
            alt={preview.title}
            fill
            sizes="(max-width: 640px) 112px, 144px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <NewspaperIcon className="h-10 w-10 text-blue-500/40 dark:text-blue-400/30" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3 sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
          Artículo · {preview.communityName}
        </p>
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 sm:text-base">
          {preview.title}
        </h4>
        {(preview.subtitle || preview.summary) && (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:text-sm">
            {preview.subtitle ?? preview.summary}
          </p>
        )}
        {preview.readTime && (
          <p className="mt-auto inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-3 w-3" />
            {preview.readTime} min de lectura
          </p>
        )}
      </div>
    </Link>
  );
}
