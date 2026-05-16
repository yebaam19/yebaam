import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getMusicClubBySlug } from '@/features/music-archive/server/clubs.server';
import { getClubForoBoard } from '@/features/clubs/server/clubs.server';
import SpaceBoard from '@/features/foro/components/SpaceBoard';

export default async function MusicClubForoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getMusicClubBySlug(slug);
  if (!club) notFound();
  const [board, t] = await Promise.all([
    getClubForoBoard(club.id),
    getTranslations('musica'),
  ]);
  if (!board) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('clubs.foroHeading')}</h2>
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          {t('clubs.foroNotEnabled')}
        </p>
      </section>
    );
  }
  const { space, categories } = board;
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('clubs.foroHeading')}</h2>
        <Link
          href={`/foro/${space.slug}` as Route}
          className="text-xs text-amber-700 hover:underline dark:text-amber-300"
        >
          {t('clubs.foroViewFull')}
        </Link>
      </div>
      <SpaceBoard space={space} categories={categories} />
    </section>
  );
}
