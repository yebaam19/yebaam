import { notFound, redirect } from 'next/navigation';
import type { Route } from 'next';
import { getServerClient } from '@/utils/supabase/server';
import {
  getMusicClubBySlug,
  getViewerRoleInClub,
} from '@/features/music-archive/server/clubs.server';
import { MusicArticleEditor } from '@/features/music-archive/components/club/MusicArticleEditor';

export default async function NewClubArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getMusicClubBySlug(slug);
  if (!club) notFound();
  const client = await getServerClient();
  const { data: u } = await client.auth.getUser();
  if (!u.user) {
    redirect(`/login?next=/musica/clubes/${slug}/articulos/nuevo` as Route);
  }
  const role = await getViewerRoleInClub(club.id);
  if (!role) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Nuevo artículo</h2>
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          Debes ser miembro de este club para escribir un artículo.
        </p>
      </section>
    );
  }
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Nuevo artículo</h2>
      <MusicArticleEditor clubId={club.id} clubSlug={slug} />
    </section>
  );
}
