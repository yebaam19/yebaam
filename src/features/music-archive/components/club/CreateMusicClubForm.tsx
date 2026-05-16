'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { createMusicClub } from '../../actions/clubs.actions';

interface GenreOption {
  id: string;
  name: string;
}

interface Props {
  genres: GenreOption[];
}

/** Single-screen form to create a new music club. On success → redirects to
 *  /musica/clubes/<new-slug>. */
export function CreateMusicClubForm({ genres }: Props) {
  const t = useTranslations('musica');
  const router = useRouter();
  const [name, setName] = useState('');
  const [genreId, setGenreId] = useState<string>(genres[0]?.id ?? '');
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
          musicGenreId: genreId,
          description,
          coverCfImageId,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.push(`/musica/clubes/${res.data.slug}` as Route);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('club.create.errGeneric'));
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t('club.create.nameLabel')}
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('club.create.namePlaceholder')}
          maxLength={80}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base font-semibold dark:border-zinc-700 dark:bg-zinc-800"
        />
        <p className="mt-1 text-xs text-zinc-500">
          {t('club.create.charCount', { current: name.length })}
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t('club.create.genreLabel')}
        </label>
        <select
          value={genreId}
          onChange={(e) => setGenreId(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t('club.create.descLabel')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={t('club.create.descPlaceholder')}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-relaxed dark:border-zinc-700 dark:bg-zinc-800"
        />
        <p className="mt-1 text-xs text-zinc-500">{description.length}/1000</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t('club.create.coverLabel')}
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
          {pending ? t('club.create.submitting') : t('club.create.submit')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {t('admin.cancel')}
        </button>
      </div>
    </div>
  );
}
