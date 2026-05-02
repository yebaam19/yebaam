import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import {
  canPublishCommunityArticle,
  listCommunityArticles,
} from '@/features/communities/server/community-articles.server';
import { CommunityTopTabs } from '@/features/communities/components/CommunityTopTabs';
import { CommunityArticleCard } from '@/features/communities/components/CommunityArticleCard';
import { NewspaperIcon, PencilSquareIcon } from '@/components/icons/heroicons-shim';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CommunityArticlesPage({ params }: PageProps) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [articles, canPublish] = await Promise.all([
    listCommunityArticles(community.id, { limit: 30 }),
    canPublishCommunityArticle(community.id),
  ]);

  return (
    <div className="space-y-6">
      <CommunityTopTabs slug={slug} />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            Artículos de la comunidad
          </h1>
          {articles.length > 0 && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {articles.length} {articles.length === 1 ? 'artículo publicado' : 'artículos publicados'}
            </p>
          )}
        </div>
        {canPublish && (
          <Link
            href={`/feed/comunidades/${slug}/articulos/nuevo` as Route}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Nuevo artículo
          </Link>
        )}
      </header>

      {articles.length > 0 ? (
        <div className="@container">
          <div className="grid grid-cols-1 gap-5 @[520px]:grid-cols-2 @[860px]:grid-cols-3 @[860px]:gap-6">
            {articles.map((article) => (
              <CommunityArticleCard
                key={article.id}
                communitySlug={slug}
                article={article}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
            <NewspaperIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Todavía no hay artículos
          </h2>
          <p className="mx-auto mb-5 max-w-sm text-sm text-gray-600 dark:text-gray-400">
            {canPublish
              ? 'Comparte el primer artículo con los miembros de la comunidad.'
              : 'El propietario o un admin de la comunidad publicará artículos aquí.'}
          </p>
          {canPublish && (
            <Link
              href={`/feed/comunidades/${slug}/articulos/nuevo` as Route}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <PencilSquareIcon className="h-4 w-4" />
              Escribir artículo
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
