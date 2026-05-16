import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata, Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { getServerClient } from '@/utils/supabase/server';
import { UploadAlbumForm } from '@/features/music-archive/components/UploadAlbumForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('musica');
  return { title: t('upload.metaTitle') };
}

export default async function MusicUploadPage() {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data.user) {
    redirect('/login?redirect=/musica/subir' as Route);
  }
  const t = await getTranslations('musica');

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav className="text-xs">
        <Link
          href={'/musica' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {t('upload.backToArchive')}
        </Link>
      </nav>
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          {t('upload.title')}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t('upload.subtitle')}
        </p>
      </header>
      <UploadAlbumForm />
    </div>
  );
}
