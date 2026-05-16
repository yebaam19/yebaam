import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { PlusIcon } from '@/components/icons/heroicons-shim';
import { listMusicClubs } from '@/features/music-archive/server/clubs.server';
import { MusicClubsGrid } from '@/features/music-archive/components/MusicClubsGrid';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('musica');
  return {
    title: t('clubs.metaTitle'),
    description: t('clubs.metaDescription'),
  };
}

export default async function MusicClubsLandingPage() {
  const clubs = await listMusicClubs();
  const t = await getTranslations('musica');

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav className="text-xs">
        <Link
          href={'/musica' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {t('clubs.backToArchive')}
        </Link>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            {t('clubs.title')}
          </h1>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            {t('clubs.subtitle')}
          </p>
        </div>
        <Link
          href={'/musica/clubes/nuevo' as Route}
          className="inline-flex flex-none items-center gap-1.5 self-start rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          <PlusIcon className="h-4 w-4" /> {t('clubs.createCta')}
        </Link>
      </header>

      {clubs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          {t('clubs.empty')}
        </p>
      ) : (
        <MusicClubsGrid clubs={clubs} />
      )}
    </div>
  );
}
