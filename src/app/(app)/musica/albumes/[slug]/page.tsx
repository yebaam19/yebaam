import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata, Route } from 'next';
import { MusicalNoteIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import { getPublicAudioUrl } from '@/lib/cloudflare/r2';
import { getAlbumBySlug } from '@/features/music-archive/server/music.server';
import { AlbumTracklist } from '@/features/music-archive/components/AlbumTracklist';

const FORMAT_LABEL: Record<string, string> = {
  lp: 'LP',
  '78rpm': '78 RPM',
  single: 'Single',
  ep: 'EP',
  compilation: 'Compilación',
  cd: 'CD',
  cassette: 'Cassette',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);
  if (!album) return { title: 'Álbum no encontrado' };
  return {
    title: `${album.title} — ${album.artist.name}`,
    description: `${album.title} de ${album.artist.name}${album.year ? ` (${album.year})` : ''}. ${album.tracks.length} canciones disponibles para escuchar.`,
  };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);
  if (!album) notFound();

  // Pre-sign R2 URLs for every track in parallel. The TTL is 1h which is
  // plenty for a single page session.
  const audioEntries = await Promise.all(
    album.tracks.map(async (t) => {
      try {
        const url = await getPublicAudioUrl(t.r2_key, 3600);
        return [t.id, url] as const;
      } catch {
        return [t.id, ''] as const;
      }
    }),
  );
  const audioUrlByTrackId = Object.fromEntries(
    audioEntries.filter(([, url]) => url !== ''),
  ) as Record<string, string>;

  const cover = album.cover_cf_image_id ? imageUrl(album.cover_cf_image_id, 'public') : null;

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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
          {cover ? (
            <img
              src={cover}
              alt={`Carátula: ${album.title}`}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center">
              <MusicalNoteIcon className="h-16 w-16 text-zinc-400" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {album.title}
          </h1>
          <Link
            href={`/musica/artistas/${album.artist.slug}` as Route}
            className="inline-block text-base font-medium text-amber-700 hover:underline dark:text-amber-400"
          >
            {album.artist.name}
          </Link>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2 text-sm">
            {album.year && (
              <Field label="Año" value={String(album.year)} />
            )}
            {album.country && (
              <Field label="País" value={album.country} />
            )}
            <Field label="Formato" value={FORMAT_LABEL[album.format] ?? album.format} />
            {album.label && (
              <Field
                label="Sello"
                value={album.label.name}
                href={`/musica/sellos/${album.label.slug}`}
              />
            )}
            {album.catalog_number && (
              <Field label="Cat. #" value={album.catalog_number} />
            )}
            <Field label="Canciones" value={String(album.tracks.length)} />
          </dl>

          {album.notes && (
            <p className="pt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {album.notes}
            </p>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Lista de canciones
        </h2>
        <AlbumTracklist album={album} audioUrlByTrackId={audioUrlByTrackId} />
      </section>

      {(album.back_cover_cf_image_id || album.label_cf_image_id) && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Más imágenes
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {album.back_cover_cf_image_id && (
              <a
                href={imageUrl(album.back_cover_cf_image_id, 'public')}
                target="_blank"
                rel="noopener noreferrer"
                className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <img
                  src={imageUrl(album.back_cover_cf_image_id, 'public')}
                  alt="Contraportada"
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              </a>
            )}
            {album.label_cf_image_id && (
              <a
                href={imageUrl(album.label_cf_image_id, 'public')}
                target="_blank"
                rel="noopener noreferrer"
                className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <img
                  src={imageUrl(album.label_cf_image_id, 'public')}
                  alt="Etiqueta del disco"
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-900 dark:text-zinc-100">
        {href ? (
          <Link href={href as Route} className="hover:underline">
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
