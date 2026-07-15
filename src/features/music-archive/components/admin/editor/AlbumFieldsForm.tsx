'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  ALBUM_CONDITION_LABELS,
  type AlbumCondition,
  type MusicAlbumFormat,
  type MusicAlbumRow,
  type MusicArtistRow,
} from '../../../types/music.types';
import { COUNTRIES, FORMATS, inputCls, sortCountryCodesByLabel } from '../../upload/constants';
import { LabelAutocomplete } from '../../upload/LabelAutocomplete';
import { CoverField } from './CoverField';
import type { AlbumFieldsSetters, AlbumFieldsValues } from './useAlbumFields';

interface Props {
  album: MusicAlbumRow;
  artist: MusicArtistRow | null;
  fields: AlbumFieldsValues;
  setters: AlbumFieldsSetters;
  saving: boolean;
  onSave: () => void;
}

const DECADES: number[] = (() => {
  const out: number[] = [];
  for (let d = 1900; d <= 2020; d += 10) out.push(d);
  return out;
})();

/** Album-level field block inside the AdminAlbumEditor — every editable
 *  scalar plus the three cover slots. The parent owns state (via
 *  `useAlbumEditor`) so a single Save button submits everything in one
 *  updateAlbum call. */
export function AlbumFieldsForm({ album, artist, fields, setters, saving, onSave }: Props) {
  const t = useTranslations('musica');
  const sortedCountries = useMemo(
    () => sortCountryCodesByLabel(COUNTRIES, (code) => t(`countries.${code}` as const)),
    [t],
  );

  function syncDecadeFromYear() {
    const n = Number(fields.year);
    if (!fields.year || Number.isNaN(n) || n < 1850 || n > 2030) return;
    const computed = Math.floor(n / 10) * 10;
    if (!fields.decade) setters.setDecade(String(computed));
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs font-medium">{t('admin.albumEditor.titleField')}</label>
          <input
            type="text"
            value={fields.title}
            onChange={(e) => setters.setTitle(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">{t('admin.albumEditor.artistField')}</label>
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            {artist?.name ?? t('upload.fieldEmpty')}
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium">
            {t('admin.albumEditor.accompanimentField')}
          </label>
          <input
            type="text"
            value={fields.accompaniment}
            onChange={(e) => setters.setAccompaniment(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">{t('admin.albumEditor.yearField')}</label>
          <input
            type="number"
            value={fields.year}
            onChange={(e) => setters.setYear(e.target.value)}
            onBlur={syncDecadeFromYear}
            className={inputCls}
            min={1800}
            max={2100}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">
            {t('admin.albumEditor.decadeField')}
          </label>
          <select
            value={fields.decade}
            onChange={(e) => setters.setDecade(e.target.value)}
            className={inputCls}
          >
            <option value="">{t('upload.fieldEmpty')}</option>
            {DECADES.map((d) => (
              <option key={d} value={d}>
                {t('album.decadeValue', { decade: d })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t('admin.albumEditor.countryField')}</label>
          <select
            value={fields.country}
            onChange={(e) => setters.setCountry(e.target.value)}
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
          <label className="mb-1 block text-xs font-medium">{t('admin.albumEditor.formatField')}</label>
          <select
            value={fields.format}
            onChange={(e) => setters.setFormat(e.target.value as MusicAlbumFormat)}
            className={inputCls}
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {t(`formats.${f}` as const)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t('admin.albumEditor.labelField')}</label>
          <LabelAutocomplete value={fields.label} onChange={setters.setLabel} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t('admin.albumEditor.catalogNumberField')}</label>
          <input
            type="text"
            value={fields.catalogNumber}
            onChange={(e) => setters.setCatalogNumber(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">{t('admin.albumEditor.notesField')}</label>
        <textarea
          value={fields.notes}
          onChange={(e) => setters.setNotes(e.target.value)}
          rows={3}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium">{t('admin.albumEditor.conditionField')}</label>
          <select
            value={fields.condition}
            onChange={(e) => setters.setCondition(e.target.value as AlbumCondition | '')}
            className={inputCls}
          >
            <option value="">{t('upload.fieldEmpty')}</option>
            {(Object.keys(ALBUM_CONDITION_LABELS) as AlbumCondition[]).map((c) => (
              <option key={c} value={c}>
                {t(`conditions.${c}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fields.forTrade}
              onChange={(e) => setters.setForTrade(e.target.checked)}
              className="h-4 w-4"
            />
            <span>{t('admin.albumEditor.tradeField')}</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CoverField
          label={t('admin.albumEditor.coverFrontField')}
          currentId={album.cover_cf_image_id}
          file={fields.coverFront}
          onChange={setters.setCoverFront}
        />
        <CoverField
          label={t('admin.albumEditor.coverBackField')}
          currentId={album.back_cover_cf_image_id}
          file={fields.coverBack}
          onChange={setters.setCoverBack}
        />
        <CoverField
          label={t('admin.albumEditor.labelImageField')}
          currentId={album.label_cf_image_id}
          file={fields.labelImage}
          onChange={setters.setLabelImage}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {saving ? t('admin.albumEditor.savingAlbum') : t('admin.albumEditor.saveAlbum')}
        </button>
      </div>
    </>
  );
}
