import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
  );
}
