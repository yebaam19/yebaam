import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata, Route } from 'next';
import { MusicalNoteIcon } from '@/components/icons/heroicons-shim';
import {
  getMusicClubBySlug,
  listAlbumsForClub,
} from '@/features/music-archive/server/clubs.server';
import { AlbumCoverCard } from '@/features/music-archive/components/AlbumCoverCard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const club = await getMusicClubBySlug(slug);
  if (!club) return { title: 'Club no encontrado' };
  return {
    title: `${club.name} — Club de coleccionistas`,
    description: `${club.description} · ${club.album_count} álbumes, ${club.member_count} miembros.`,
  };
}

export default async function MusicClubDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getMusicClubBySlug(slug);
  if (!club) notFound();
  const albums = await listAlbumsForClub(club.id);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav className="text-xs">
        <Link
          href={'/musica/clubes' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Clubes
        </Link>
      </nav>

      {/* Hero — cover/gradient + name + stats + description. */}
      <header className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 dark:border-zinc-800 dark:from-amber-900/20 dark:via-zinc-900 dark:to-rose-900/20 sm:p-10">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
          <MusicalNoteIcon className="h-4 w-4" />
          <span>Club · {club.music_genre.replace(/_/g, ' ')}</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
          {club.name}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {club.description}
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          {club.album_count} álbum{club.album_count === 1 ? '' : 'es'} · {club.member_count}{' '}
          miembro{club.member_count === 1 ? '' : 's'}
        </p>
        <div className="mt-4">
          <Link
            href={`/feed/clubs/${club.slug}` as Route}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:bg-zinc-900 dark:text-amber-300"
          >
            Ver discusiones, eventos y miembros →
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Discos del club
        </h2>
        {albums.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
            Aún no hay discos en este club.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {albums.map((a) => (
              <AlbumCoverCard key={a.id} album={a} artistName={a.artist_name} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
