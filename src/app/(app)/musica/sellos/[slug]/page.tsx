import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata, Route } from 'next';
import { MusicalNoteIcon } from '@/components/icons/heroicons-shim';
import { getLabelBySlug } from '@/features/music-archive/server/music.server';
import { listArticlesForLabel } from '@/features/music-archive/server/music-articles.server';
import { AlbumCoverCard } from '@/features/music-archive/components/AlbumCoverCard';
import { MusicArticleCard } from '@/features/music-archive/components/club/MusicArticleCard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const label = await getLabelBySlug(slug);
  if (!label) return { title: 'Sello no encontrado' };
  return {
    title: label.name,
    description: `${label.name}${label.country ? ` (${label.country})` : ''}. ${label.albums.length} discos en el archivo.`,
  };
}

export default async function LabelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const label = await getLabelBySlug(slug);
  if (!label) notFound();
  const articles = await listArticlesForLabel(label.id);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav className="text-xs">
        <Link
          href={'/musica' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Archivo Musical
        </Link>
      </nav>

      <header className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
          <div className="flex aspect-square items-center justify-center">
            <MusicalNoteIcon className="h-12 w-12 text-zinc-400" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Sello discográfico</p>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{label.name}</h1>
          <p className="text-sm text-zinc-500">
            {[label.country, label.founded ? `Fundado en ${label.founded}` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Catálogo</h2>
          <span className="text-xs text-zinc-500">
            {label.albums.length} {label.albums.length === 1 ? 'álbum' : 'álbumes'}
          </span>
        </div>
        {label.albums.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
            Este sello aún no tiene álbumes en el archivo.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {label.albums.map((a) => (
              <AlbumCoverCard key={a.id} album={a} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Artículos sobre {label.name}
        </h2>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) =>
              a.club ? (
                <MusicArticleCard key={a.id} article={a} clubSlug={a.club.slug} />
              ) : null,
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
            Aún no hay artículos sobre {label.name}. Los artículos se escriben desde la
            sección «Artículos» de un club de música — únete o crea un club, y los artículos
            que etiqueten a este sello aparecerán aquí automáticamente.
          </p>
        )}
      </section>
    </div>
  );
}
