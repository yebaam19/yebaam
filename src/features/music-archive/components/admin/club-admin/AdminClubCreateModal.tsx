'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { adminCreateMusicClub } from '../../../actions/club-settings.actions';
import { ClubGenreSelector } from './ClubGenreSelector';

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
  const t = useTranslations('musica.admin.clubCreate');
  const [name, setName] = useState('');
  const [genreId, setGenreId] = useState<string>(genres[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        setError(err instanceof Error ? err.message : t('errGeneric'));
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('heading')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700"
            aria-label={t('closeAria')}
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('nameLabel')}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder={t('namePlaceholder')}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base font-semibold dark:border-zinc-700 dark:bg-zinc-800"
            />
            <p className="mt-1 text-xs text-zinc-500">{t('nameCounter', { current: name.length })}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('genreLabel')}
            </label>
            <ClubGenreSelector genres={genres} selectedId={genreId} onSelect={setGenreId} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={t('descriptionPlaceholder')}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-relaxed dark:border-zinc-700 dark:bg-zinc-800"
            />
            <p className="mt-1 text-xs text-zinc-500">{t('descCounter', { current: description.length })}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('coverLabel')}
            </label>
            {coverPreview && (
              <div className="mb-2 h-20 w-32 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                <img src={coverPreview} alt={t('previewAlt')} className="h-full w-full object-cover" decoding="async" loading="lazy" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <p className="mt-1 text-xs text-zinc-500">
              {t('coverHint')}
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
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || name.trim().length < 3 || !genreId}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
          >
            {pending ? t('submitting') : t('submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
