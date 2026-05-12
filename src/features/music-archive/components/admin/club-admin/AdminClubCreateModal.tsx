'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { uploadService } from '@/lib/service/upload.service';
import { adminCreateMusicClub } from '../../../actions/club-admin.actions';

/** Lowercased + accent-stripped form for case/diacritic-insensitive matching. */
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

interface GenreOption {
  id: string;
  name: string;
}

export interface AdminClubCreatedRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  rules: string[];
  music_genre_id: string;
  genre_slug: string;
  genre_name: string;
  cover_image_url: string | null;
  member_count: number;
  pending_count: number;
  post_count: number;
  article_count: number;
  forum_enabled: boolean;
}

interface Props {
  genres: GenreOption[];
  /** Existing genre rows from listGenresWithUsage, used to fill `genre_slug` on
   *  the returned row. Pass undefined to skip slug enrichment (the table only
   *  uses `genre_name` for display). */
  genreSlugById?: Map<string, string>;
  onClose: () => void;
  onCreated: (row: AdminClubCreatedRow) => void;
}

export function AdminClubCreateModal({ genres, genreSlugById, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [genreId, setGenreId] = useState<string>(genres[0]?.id ?? '');
  const [genreQuery, setGenreQuery] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredGenres = useMemo(() => {
    const q = normalize(genreQuery.trim());
    if (!q) return genres;
    return genres.filter((g) => normalize(g.name).includes(q));
  }, [genres, genreQuery]);

  const selectedGenreName = useMemo(
    () => genres.find((g) => g.id === genreId)?.name ?? '',
    [genres, genreId],
  );

  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile],
  );
  useEffect(() => {
    if (!coverPreview) return;
    return () => URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        let coverCfImageId: string | null = null;
        if (coverFile) {
          const up = await uploadService.uploadImage(coverFile);
          coverCfImageId = up.id;
        }
        const res = await adminCreateMusicClub({
          name,
          musicGenreId: genreId,
          description,
          coverCfImageId,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        const genreName = genres.find((g) => g.id === genreId)?.name ?? '';
        const genreSlug = genreSlugById?.get(genreId) ?? '';
        onCreated({
          id: res.data.id,
          name: name.trim(),
          slug: res.data.slug,
          description: description.trim(),
          rules: [],
          music_genre_id: genreId,
          genre_slug: genreSlug,
          genre_name: genreName,
          cover_image_url: coverCfImageId,
          member_count: 1,
          pending_count: 0,
          post_count: 0,
          article_count: 0,
          forum_enabled: false,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo crear el club.');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Crear club</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Nombre del club
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Boleros yucatecos"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base font-semibold dark:border-zinc-700 dark:bg-zinc-800"
            />
            <p className="mt-1 text-xs text-zinc-500">{name.length}/80 · mínimo 3 caracteres</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Género musical
            </label>
            {genres.length === 0 ? (
              <p className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
                — Sin géneros disponibles —
              </p>
            ) : (
              <div className="space-y-2">
                <input
                  type="search"
                  value={genreQuery}
                  onChange={(e) => setGenreQuery(e.target.value)}
                  placeholder={`Buscar entre ${genres.length} géneros… (ej. bachata, jazz, k-pop)`}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  aria-label="Buscar género"
                />
                <div
                  role="listbox"
                  aria-label="Lista de géneros"
                  className="max-h-56 overflow-y-auto rounded-md border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {filteredGenres.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-zinc-500">
                      Ningún género coincide con &ldquo;{genreQuery}&rdquo;.
                    </p>
                  ) : (
                    filteredGenres.map((g) => {
                      const selected = g.id === genreId;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => setGenreId(g.id)}
                          className={
                            'block w-full rounded-sm px-2 py-1.5 text-left text-sm transition ' +
                            (selected
                              ? 'bg-amber-600 text-white'
                              : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800')
                          }
                        >
                          {g.name}
                        </button>
                      );
                    })
                  )}
                </div>
                {selectedGenreName && (
                  <p className="text-xs text-zinc-500">
                    Seleccionado: <span className="font-medium text-zinc-700 dark:text-zinc-200">{selectedGenreName}</span>
                  </p>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Cuéntale a los miembros de qué trata este club…"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-relaxed dark:border-zinc-700 dark:bg-zinc-800"
            />
            <p className="mt-1 text-xs text-zinc-500">{description.length}/1000</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Imagen de portada (opcional)
            </label>
            {coverPreview && (
              <div className="mb-2 h-20 w-32 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                <img src={coverPreview} alt="Vista previa" className="h-full w-full object-cover" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Se sube a Cloudflare Images y aparece como banner en la página del club.
            </p>
          </div>
        </div>
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || name.trim().length < 3 || !genreId}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
          >
            {pending ? 'Creando…' : 'Crear club'}
          </button>
        </div>
      </div>
    </div>
  );
}
