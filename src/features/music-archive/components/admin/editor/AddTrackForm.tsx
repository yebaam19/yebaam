'use client';

import { useState } from 'react';
import type { MusicAlbumFormat, MusicTrackSide } from '../../../types/music.types';
import { fileInputCls, inputCls, titleFromFilename } from '../../upload/constants';

interface NewTrackInput {
  title: string;
  position: number;
  side: MusicTrackSide | null;
  file: File;
}

interface Props {
  nextPosition: number;
  albumFormat?: MusicAlbumFormat;
  onAdd: (input: NewTrackInput) => Promise<void>;
}

/** Inline form to append a new track to an existing album. Lives at the
 *  bottom of the AdminAlbumEditor. Handles the title autocomplete from the
 *  filename and resets after a successful add. */
export function AddTrackForm({ nextPosition, albumFormat, onAdd }: Props) {
  const isSingleOr78 = albumFormat === 'single' || albumFormat === '78rpm';
  const defaultSide: MusicTrackSide | '' = isSingleOr78
    ? nextPosition === 1
      ? 'a'
      : 'b'
    : '';
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [position, setPosition] = useState<string>(nextPosition.toString());
  const [side, setSide] = useState<MusicTrackSide | ''>(defaultSide);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFile(picked: File | undefined) {
    if (!picked) {
      setFile(null);
      return;
    }
    setFile(picked);
    if (!title.trim()) setTitle(titleFromFilename(picked.name));
  }

  async function submit() {
    if (!file || !title.trim()) {
      setError('Selecciona un archivo y un título.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onAdd({
        title: title.trim(),
        position: Number(position) || nextPosition,
        side: side || null,
        file,
      });
      // Reset for the next track. When single/78rpm, prefill side B for the
      // typical "Lado A / Lado B" cadence.
      const nextPos = Number(position) + 1;
      setFile(null);
      setTitle('');
      setPosition(nextPos.toString());
      setSide(isSingleOr78 ? (nextPos === 1 ? 'a' : 'b') : '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-md border border-dashed border-zinc-300 bg-zinc-50/60 p-3 dark:border-zinc-700 dark:bg-zinc-900/40">
      {isSingleOr78 && (
        <p className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-200">
          Disco de 1–2 canciones (Lado A / Lado B). Marca el lado al subir cada track.
        </p>
      )}
      <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Agregar canción
      </p>
      <div className="grid grid-cols-12 items-center gap-2 text-sm">
        <input
          type="number"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className={`${inputCls} col-span-1`}
          min={1}
          max={99}
        />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de la canción"
          className={`${inputCls} col-span-4`}
        />
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as MusicTrackSide | '')}
          className={`${inputCls} col-span-1`}
        >
          <option value="">—</option>
          <option value="a">A</option>
          <option value="b">B</option>
        </select>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => pickFile(e.target.files?.[0])}
          className={`${fileInputCls} col-span-4`}
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || !file || !title.trim()}
          className="col-span-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {busy ? 'Subiendo…' : 'Agregar'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}
