import Link from 'next/link';
import type { Metadata, Route } from 'next';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/utils/supabase/server';
import { CreateMusicClubForm } from '@/features/music-archive/components/club/CreateMusicClubForm';

export const metadata: Metadata = { title: 'Crear club · Archivo Musical' };

export default async function NewMusicClubPage() {
  const client = await getServerClient();
  const { data: u } = await client.auth.getUser();
  if (!u.user) {
    redirect('/login?next=/musica/clubes/nuevo' as Route);
  }
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav className="text-xs">
        <Link
          href={'/musica/clubes' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Clubes
        </Link>
      </nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Crear un nuevo club
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Reúne coleccionistas alrededor de un género. Tú quedas como dueño y puedes invitar
          administradores y moderadores más tarde.
        </p>
      </header>
      <CreateMusicClubForm />
    </div>
  );
}
