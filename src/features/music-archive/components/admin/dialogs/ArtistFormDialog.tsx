'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { createArtist, updateArtist } from '../../../actions/artists.actions';
import type { MusicArtistRow } from '../../../types/music.types';
import { COUNTRIES, inputCls, sortCountryCodesByLabel } from '../../upload/constants';
import { CoverDropZone } from '../../upload/CoverDropZone';

interface InitialValues {
  id?: string;
  name?: string;
  country?: string | null;
  born_year?: number | null;
  died_year?: number | null;
  bio_short?: string | null;
  photo_cf_image_id?: string | null;
}

interface Props {
  /** Pass an existing row → edit mode. Omit → create mode. */
  initial?: InitialValues;
  onClose: () => void;
  onSaved: (row: MusicArtistRow) => void;
}

/** Single dialog shared by "Agregar artista" and "Editar artista". The fields
 *  are identical; only the action call at the end differs (createArtist vs
 *  updateArtist). Keeping them unified avoids drift between the two paths. */
export function ArtistFormDialog({ initial, onClose, onSaved }: Props) {
  const t = useTranslations('musica');
  const isEdit = Boolean(initial?.id);
  const sortedCountries = useMemo(
    () => sortCountryCodesByLabel(COUNTRIES, (code) => t(`countries.${code}` as const)),
    [t],
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [country, setCountry] = useState(initial?.country ?? '');
  const [bornYear, setBornYear] = useState(initial?.born_year?.toString() ?? '');
  const [diedYear, setDiedYear] = useState(initial?.died_year?.toString() ?? '');
  const [bioShort, setBioShort] = useState(initial?.bio_short ?? '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    let photoCfImageId: string | undefined;
    if (photo) {
      try {
        const r = await uploadService.uploadImage(photo);
        photoCfImageId = r.id;
      } catch (e) {
        setError(e instanceof Error ? e.message : t('admin.artistEditor.errGeneric'));
        setSaving(false);
        return;
      }
    }

    const dto = {
      name: name.trim(),
      country: country || undefined,
      bornYear: bornYear ? Number(bornYear) : undefined,
      diedYear: diedYear ? Number(diedYear) : undefined,
      bioShort: bioShort.trim() || undefined,
      ...(photoCfImageId ? { photoCfImageId } : {}),
    };

    const res = isEdit && initial?.id
      ? await updateArtist(initial.id, {
          ...dto,
          country: country || null,
          bornYear: bornYear ? Number(bornYear) : null,
          diedYear: diedYear ? Number(diedYear) : null,
          bioShort: bioShort.trim() || null,
        })
      : await createArtist(dto);

    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSaved(res.data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <h3 className="mb-4 text-lg font-semibold">
          {isEdit ? t('admin.artistEditor.editTitle') : t('admin.artistEditor.newTitle')}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {t('admin.artistEditor.name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              maxLength={120}
              placeholder={t('upload.artistPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {t('admin.artistEditor.country')}
              </label>
              <select
                value={country ?? ''}
                onChange={(e) => setCountry(e.target.value)}
                className={inputCls}
              >
                <option value="">{t('upload.fieldEmpty')}</option>
                {sortedCountries.map((code) => (
                  <option key={code} value={code}>
                    {t(`countries.${code}` as const)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {t('admin.artistEditor.bornYear')}
              </label>
              <input
                type="number"
                value={bornYear}
                onChange={(e) => setBornYear(e.target.value)}
                className={inputCls}
                min={1800}
                max={2100}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {t('admin.artistEditor.diedYear')}
              </label>
              <input
                type="number"
                value={diedYear}
                onChange={(e) => setDiedYear(e.target.value)}
                className={inputCls}
                min={1800}
                max={2100}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {t('admin.artistEditor.photo')}
            </label>
            <CoverDropZone file={photo} onChange={setPhoto} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {t('admin.artistEditor.bioShort')}
              </label>
              <span className="text-[10px] tabular-nums text-zinc-500">
                {bioShort.length} / 1000
              </span>
            </div>
            <textarea
              value={bioShort}
              onChange={(e) => setBioShort(e.target.value)}
              className={`${inputCls} resize-y`}
              maxLength={1000}
              rows={4}
            />
          </div>
        </div>
        {error && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
          >
            {t('admin.cancel')}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !name.trim()}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {saving ? t('admin.artistEditor.submitting') : t('admin.artistEditor.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
