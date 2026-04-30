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
    <div className="space-y-5">
      <CommunityTopTabs slug={slug} />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-base font-semibold text-gray-900 dark:text-white">
          Artículos de la comunidad
        </h1>
        {canPublish && (
          <Link
            href={`/feed/comunidades/${slug}/articulos/nuevo` as Route}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Nuevo artículo
          </Link>
        )}
      </header>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <CommunityArticleCard
              key={article.id}
              communitySlug={slug}
              article={article}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
            <NewspaperIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            Todavía no hay artículos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {canPublish
              ? 'Comparte el primer artículo con los miembros de la comunidad.'
              : 'El propietario o un admin de la comunidad publicará artículos aquí.'}
          </p>
          {canPublish && (
            <Link
              href={`/feed/comunidades/${slug}/articulos/nuevo` as Route}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
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
