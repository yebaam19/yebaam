import Link from 'next/link';
import type { Route } from 'next';
import { imageUrl } from '@/lib/media/urls';
import type { MusicArticleWithRefs } from '../../types/music.types';

interface Props {
  article: MusicArticleWithRefs;
  clubSlug: string;
}

export function MusicArticleCard({ article, clubSlug }: Props) {
  const hero = article.cf_image_id ? imageUrl(article.cf_image_id, 'public') : null;
  const date = article.published_at ?? article.created_at;
  return (
    <Link
      href={`/musica/clubes/${clubSlug}/articulos/${article.slug}` as Route}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white transition-colors hover:border-amber-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-600"
    >
      {hero && (
        <div className="aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <img
            src={hero}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            decoding="async"
            loading="lazy"
          />
        </div>
      )}
      <div className="space-y-2 p-4">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {article.title}
        </h3>
        {article.subtitle && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{article.subtitle}</p>
        )}
        {article.summary && (
          <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{article.summary}</p>
        )}
        <div className="flex flex-wrap gap-1.5 pt-1 text-xs text-zinc-500">
          <span>{formatDate(date)}</span>
          {article.author && (
            <>
              <span>·</span>
              <span>{article.author.full_name || article.author.username || 'Autor'}</span>
            </>
          )}
          {article.artists.length > 0 && (
            <>
              <span>·</span>
              <span className="truncate">
                {article.artists.map((a) => a.name).join(', ')}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}
