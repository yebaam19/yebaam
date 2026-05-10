import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { listMusicClubs } from '@/features/music-archive/server/clubs.server';
import { MusicClubsGrid } from '@/features/music-archive/components/MusicClubsGrid';

export const metadata: Metadata = {
  title: 'Clubes · Archivo Musical Latinoamericano',
  description:
    'Coleccionistas de música organizados por género: salsa, tango, bolero, mambo, cumbia, vallenato, bossa nova y más. Cada club es un espacio independiente con su propia discoteca, miembros y conversaciones.',
};

export default async function MusicClubsLandingPage() {
  const clubs = await listMusicClubs();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav className="text-xs">
        <Link
          href={'/musica' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Archivo Musical
        </Link>
      </nav>

      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
          Clubes de coleccionistas
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Cada género es un club independiente con su propia discoteca, sus miembros y sus
          conversaciones. Únete a los que más te interesan; cada disco puede pertenecer a más de
          un club.
        </p>
      </header>

      {clubs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          Aún no hay clubes de música.
        </p>
      ) : (
        <MusicClubsGrid clubs={clubs} />
      )}
    </div>
  );
}
