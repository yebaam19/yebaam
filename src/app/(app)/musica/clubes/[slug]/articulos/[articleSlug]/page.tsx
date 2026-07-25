import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata, Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { imageUrl } from '@/lib/media/urls';
import { getMusicArticleBySlug } from '@/features/music-archive/server/music-articles.server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; articleSlug: string }>;
}): Promise<Metadata> {
  const { slug, articleSlug } = await params;
  const t = await getTranslations('musica');
  const article = await getMusicArticleBySlug(slug, articleSlug);
  if (!article) return { title: t('clubs.articleNotFound') };
  return {
    title: article.title,
    description: article.summary ?? article.subtitle ?? undefined,
  };
}

export default async function ClubArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string; articleSlug: string }>;
}) {
  const { slug, articleSlug } = await params;
  const article = await getMusicArticleBySlug(slug, articleSlug);
  if (!article) notFound();
  const t = await getTranslations('musica');
  const hero = article.cf_image_id ? imageUrl(article.cf_image_id, 'public') : null;
  const date = article.published_at ?? article.created_at;

  return (
    <article className="space-y-6">
      <nav className="text-xs">
        <Link
          href={`/musica/clubes/${slug}/articulos` as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {t('clubs.articleBack')}
        </Link>
      </nav>

      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="text-lg text-zinc-600 dark:text-zinc-400">{article.subtitle}</p>
        )}
        <p className="text-xs text-zinc-500">
          {formatDate(date)}
          {article.author && (
            <>
              {' · '}
              {article.author.full_name || article.author.username || t('clubs.articleAuthorFallback')}
            </>
          )}
        </p>
      </header>

      {hero && (
        <img
          src={hero}
          alt=""
          className="aspect-[16/9] w-full rounded-2xl border border-zinc-200 object-cover dark:border-zinc-800"
          decoding="async"
          loading="lazy"
        />
      )}

      <div className="prose prose-zinc max-w-none whitespace-pre-wrap text-sm leading-relaxed dark:prose-invert">
        {article.content || (
          <p className="text-zinc-500">{t('clubs.articleEmpty')}</p>
        )}
      </div>

      {article.artists.length > 0 && (
        <footer className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t('clubs.articleMentionedArtists')}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {article.artists.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/musica/artistas/${a.slug}` as Route}
                  className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                >
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}
