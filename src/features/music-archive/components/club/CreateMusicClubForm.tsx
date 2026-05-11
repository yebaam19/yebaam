'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useState, useTransition } from 'react';
import { uploadService } from '@/lib/service/upload.service';
import { createMusicClub } from '../../actions/clubs.actions';
import {
  MUSIC_GENRES,
  MUSIC_GENRE_LABELS,
  type MusicGenre,
} from '../../types/music.types';

/** Single-screen form to create a new music club. On success → redirects to
 *  /musica/clubes/<new-slug>. */
export function CreateMusicClubForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [genre, setGenre] = useState<MusicGenre>('salsa');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        let coverCfImageId: string | null = null;
        if (cover) {
          const up = await uploadService.uploadImage(cover);
          coverCfImageId = up.id;
        }
        const res = await createMusicClub({
          name,
          musicGenre: genre,
          description,
          coverCfImageId,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.push(`/musica/clubes/${res.data.slug}` as Route);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo crear el club.');
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Nombre del club
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Boleros yucatecos"
          maxLength={80}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base font-semibold dark:border-zinc-700 dark:bg-zinc-800"
        />
        <p className="mt-1 text-xs text-zinc-500">
          {name.length}/80 caracteres. Mínimo 3.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Género musical
        </label>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value as MusicGenre)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          {MUSIC_GENRES.map((g) => (
            <option key={g} value={g}>
              {MUSIC_GENRE_LABELS[g]}
            </option>
          ))}
        </select>
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
          placeholder="Cuéntale a otros coleccionistas de qué trata este club…"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-relaxed dark:border-zinc-700 dark:bg-zinc-800"
        />
        <p className="mt-1 text-xs text-zinc-500">{description.length}/1000</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Imagen de portada (opcional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCover(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending || name.trim().length < 3}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
        >
          {pending ? 'Creando…' : 'Crear club'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
