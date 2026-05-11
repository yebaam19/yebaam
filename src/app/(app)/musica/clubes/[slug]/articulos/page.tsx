import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import {
  getMusicClubBySlug,
  getViewerJoinStatus,
  getViewerRoleInClub,
} from '@/features/music-archive/server/clubs.server';
import { listMusicArticles } from '@/features/music-archive/server/music-articles.server';
import { MusicArticleCard } from '@/features/music-archive/components/club/MusicArticleCard';
import { ClubJoinCTA } from '@/features/music-archive/components/club/ClubJoinCTA';
import { PlusIcon } from '@/components/icons/heroicons-shim';

export default async function ClubArticlesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getMusicClubBySlug(slug);
  if (!club) notFound();
  const [articles, viewerRole, joinStatus] = await Promise.all([
    listMusicArticles(club.id),
    getViewerRoleInClub(club.id),
    getViewerJoinStatus(club.id),
  ]);
  const canWrite = Boolean(viewerRole);

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Artículos</h2>
        {canWrite && (
          <Link
            href={`/musica/clubes/${slug}/articulos/nuevo` as Route}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
          >
            <PlusIcon className="h-4 w-4" /> Nuevo artículo
          </Link>
        )}
      </div>
      {articles.length === 0 && !canWrite && (
        <ClubJoinCTA
          clubId={club.id}
          clubSlug={slug}
          status={joinStatus}
          label="Únete al club y sé el primero en escribir un artículo."
        />
      )}
      {articles.length === 0 && canWrite ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          Aún no hay artículos en este club. Sé el primero en publicar uno.
        </p>
      ) : (
        articles.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <MusicArticleCard key={a.id} article={a} clubSlug={slug} />
            ))}
          </div>
        )
      )}
    </section>
  );
}
