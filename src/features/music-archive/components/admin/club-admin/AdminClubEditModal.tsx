'use client';

import { useTranslations } from 'next-intl';
import type { ClubRow, GenreOption } from './admin-club-edit.types';
import { useAdminClubEdit } from './useAdminClubEdit';

export type { ClubRow as AdminClubEditRow };

interface Props {
  club: ClubRow;
  /** Optional genre catalogue. When passed, an extra selector appears so the
   *  admin can change the club's genre. */
  genres?: GenreOption[];
  onClose: () => void;
  onSaved: (next: ClubRow) => void;
}

export function AdminClubEditModal({ club, genres, onClose, onSaved }: Props) {
  const t = useTranslations('musica.admin.clubEdit');
  const {
    name,
    setName,
    description,
    setDescription,
    rules,
    genreId,
    setGenreId,
    error,
    pending,
    newCoverPreview,
    currentCoverUrl,
    setCoverFile,
    setRule,
    addRule,
    removeRule,
    save,
  } = useAdminClubEdit(club, genres, onClose, onSaved);

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
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          {genres && genres.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('genreLabel')}
              </label>
              <select
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                {!club.music_genre_id && <option value="">{t('noGenreOption')}</option>}
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-zinc-500">
                {t('genreHint')}
              </p>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('rulesLabel')}
            </label>
            <ul className="space-y-2">
              {rules.map((r, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-5 text-xs text-zinc-500">{i + 1}.</span>
                  <input
                    value={r}
                    onChange={(e) => setRule(i, e.target.value)}
                    className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(i)}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    {t('ruleRemove')}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={addRule}
              className="mt-2 text-xs text-amber-700 hover:underline dark:text-amber-300"
            >
              {t('addRule')}
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('coverLabel')}
            </label>
            {(newCoverPreview || currentCoverUrl) && (
              <div className="mb-2 flex items-center gap-3">
                <div className="h-20 w-32 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                  <img
                    src={newCoverPreview ?? currentCoverUrl ?? ''}
                    alt={newCoverPreview ? t('newCoverAlt') : t('currentCoverAlt')}
                    className="h-full w-full object-cover"
                    decoding="async"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  {newCoverPreview ? t('newCoverNote') : t('currentCoverNote')}
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <p className="mt-1 text-xs text-zinc-500">
              {t('coverHint', { slug: club.slug })}
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
            onClick={save}
            disabled={pending || !name.trim()}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
          >
            {pending ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
