'use client';

import Link from 'next/link';
import type { Route } from 'next';
import {
  ALBUM_CONDITION_LABELS,
  type AlbumCondition,
  type MusicAlbumFormat,
  type MusicAlbumRow,
  type MusicArtistRow,
  type MusicLabelRow,
} from '../../../types/music.types';
import { COUNTRIES, FORMATS, inputCls } from '../../upload/constants';
import { CoverField } from './CoverField';

interface Props {
  album: MusicAlbumRow;
  artist: MusicArtistRow | null;
  label: MusicLabelRow | null;
  title: string;
  setTitle: (v: string) => void;
  year: string;
  setYear: (v: string) => void;
  decade: string;
  setDecade: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  accompaniment: string;
  setAccompaniment: (v: string) => void;
  format: MusicAlbumFormat;
  setFormat: (v: MusicAlbumFormat) => void;
  catalogNumber: string;
  setCatalogNumber: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  condition: AlbumCondition | '';
  setCondition: (v: AlbumCondition | '') => void;
  forTrade: boolean;
  setForTrade: (v: boolean) => void;
  coverFront: File | null;
  setCoverFront: (f: File | null) => void;
  coverBack: File | null;
  setCoverBack: (f: File | null) => void;
  labelImage: File | null;
  setLabelImage: (f: File | null) => void;
  saving: boolean;
  onSave: () => void;
}

const DECADES: number[] = (() => {
  const out: number[] = [];
  for (let d = 1900; d <= 2020; d += 10) out.push(d);
  return out;
})();

/** Album-level field block inside the AdminAlbumEditor — every editable
 *  scalar plus the three cover slots. The parent owns state so a single
 *  Save button submits everything in one updateAlbum call. */
export function AlbumFieldsForm({
  album,
  artist,
  label,
  title,
  setTitle,
  year,
  setYear,
  decade,
  setDecade,
  country,
  setCountry,
  accompaniment,
  setAccompaniment,
  format,
  setFormat,
  catalogNumber,
  setCatalogNumber,
  notes,
  setNotes,
  condition,
  setCondition,
  forTrade,
  setForTrade,
  coverFront,
  setCoverFront,
  coverBack,
  setCoverBack,
  labelImage,
  setLabelImage,
  saving,
  onSave,
}: Props) {
  function syncDecadeFromYear() {
    const n = Number(year);
    if (!year || Number.isNaN(n) || n < 1850 || n > 2030) return;
    const computed = Math.floor(n / 10) * 10;
    if (!decade) setDecade(String(computed));
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs font-medium">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Artista</label>
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            {artist?.name ?? '—'}
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium">
            Acompañamiento <span className="text-zinc-400">(opcional)</span>
          </label>
          <input
            type="text"
            value={accompaniment}
            onChange={(e) => setAccompaniment(e.target.value)}
            placeholder="Ej. Mariachi Vargas de Tecalitlán"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Año</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onBlur={syncDecadeFromYear}
            className={inputCls}
            min={1800}
            max={2100}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">
            Década <span className="text-zinc-400">(si no sabes el año)</span>
          </label>
          <select
            value={decade}
            onChange={(e) => setDecade(e.target.value)}
            className={inputCls}
          >
            <option value="">—</option>
            {DECADES.map((d) => (
              <option key={d} value={d}>
                Década de los {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">País</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputCls}
          >
            <option value="">—</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Formato</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as MusicAlbumFormat)}
            className={inputCls}
          >
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Sello</label>
          {label ? (
            <Link
              href={`/musica/sellos/${label.slug}` as Route}
              className="block rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-amber-700 hover:underline dark:border-zinc-800 dark:bg-zinc-900 dark:text-amber-400"
            >
              {label.name}
            </Link>
          ) : (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              —
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Catálogo</label>
          <input
            type="text"
            value={catalogNumber}
            onChange={(e) => setCatalogNumber(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium">Estado de conservación</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as AlbumCondition | '')}
            className={inputCls}
          >
            <option value="">— Sin graduar</option>
            {(Object.keys(ALBUM_CONDITION_LABELS) as AlbumCondition[]).map((c) => (
              <option key={c} value={c}>
                {ALBUM_CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-zinc-500">
            Escala Goldmine. Indica el estado físico de tu copia.
          </p>
        </div>
        <div className="flex items-end">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={forTrade}
              onChange={(e) => setForTrade(e.target.checked)}
              className="h-4 w-4"
            />
            <span>Disponible para intercambio</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CoverField
          label="Frontal"
          currentId={album.cover_cf_image_id}
          file={coverFront}
          onChange={setCoverFront}
        />
        <CoverField
          label="Trasera"
          currentId={album.back_cover_cf_image_id}
          file={coverBack}
          onChange={setCoverBack}
        />
        <CoverField
          label="Etiqueta del disco"
          currentId={album.label_cf_image_id}
          file={labelImage}
          onChange={setLabelImage}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar álbum'}
        </button>
      </div>
    </>
  );
}
