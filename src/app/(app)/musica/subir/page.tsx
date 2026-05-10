import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata, Route } from 'next';
import { getServerClient } from '@/utils/supabase/server';
import { UploadAlbumForm } from '@/features/music-archive/components/UploadAlbumForm';

export const metadata: Metadata = {
  title: 'Subir disco — Archivo Musical',
};

export default async function MusicUploadPage() {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data.user) {
    redirect('/login?redirect=/musica/subir' as Route);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav className="text-xs">
        <Link
          href={'/musica' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Archivo Musical
        </Link>
      </nav>
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Subir un disco al archivo
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Crea el artista, el álbum y la primera canción. Las carátulas van a Cloudflare Images
          (con miniaturas automáticas), el audio va a R2.
        </p>
      </header>
      <UploadAlbumForm />
    </div>
  );
}
