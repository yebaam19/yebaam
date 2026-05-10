import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { requirePlatformAdmin } from '@/features/music-archive/server/music.server';
import { listRecentImports } from '@/features/music-archive/actions/import.actions';
import { listAdminAlbums } from '@/features/music-archive/actions/albums.actions';
import { listAdminArtists } from '@/features/music-archive/actions/artists.actions';
import { listAdminLabels } from '@/features/music-archive/actions/labels.actions';
import { AdminMusicTabs } from '@/features/music-archive/components/AdminMusicTabs';

export const metadata: Metadata = { title: 'Admin · Música' };

export default async function AdminMusicPage() {
  const admin = await requirePlatformAdmin();
  if (!admin) redirect('/admin/foros' as Route);

  const [recent, albums, artists, labels] = await Promise.all([
    listRecentImports(50),
    listAdminAlbums(),
    listAdminArtists(),
    listAdminLabels(),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Música</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sube discos, importa por enlace, y administra el archivo (editar y eliminar artistas,
          álbumes, canciones y sellos).
        </p>
      </header>
      <AdminMusicTabs
        recentImports={recent.ok ? recent.data : []}
        recentError={recent.ok ? null : recent.error}
        initialAlbums={albums.ok ? albums.data : []}
        initialArtists={artists.ok ? artists.data : []}
        initialLabels={labels.ok ? labels.data : []}
      />
    </div>
  );
}
