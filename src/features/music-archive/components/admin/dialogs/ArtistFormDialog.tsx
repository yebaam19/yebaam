'use client';

import { useState } from 'react';
import { uploadService } from '@/lib/service/upload.service';
import { createArtist, updateArtist } from '../../../actions/music.actions';
import type { MusicArtistRow } from '../../../types/music.types';
import { COUNTRIES, inputCls } from '../../upload/constants';
import { CoverDropZone } from '../../upload/CoverDropZone';

interface InitialValues {
  id?: string;
  name?: string;
  country?: string | null;
  born_year?: number | null;
  died_year?: number | null;
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
  const isEdit = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name ?? '');
  const [country, setCountry] = useState(initial?.country ?? '');
  const [bornYear, setBornYear] = useState(initial?.born_year?.toString() ?? '');
  const [diedYear, setDiedYear] = useState(initial?.died_year?.toString() ?? '');
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
        setError(e instanceof Error ? e.message : 'No se pudo subir la foto.');
        setSaving(false);
        return;
      }
    }

    const dto = {
      name: name.trim(),
      country: country || undefined,
      bornYear: bornYear ? Number(bornYear) : undefined,
      diedYear: diedYear ? Number(diedYear) : undefined,
      ...(photoCfImageId ? { photoCfImageId } : {}),
    };

    const res = isEdit && initial?.id
      ? await updateArtist(initial.id, {
          ...dto,
          country: country || null,
          bornYear: bornYear ? Number(bornYear) : null,
          diedYear: diedYear ? Number(diedYear) : null,
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
          {isEdit ? 'Editar artista' : 'Agregar artista'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              maxLength={120}
              placeholder="María Conesa"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                País
              </label>
              <select
                value={country ?? ''}
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
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Nacimiento
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
                Defunción
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
              {isEdit ? 'Reemplazar foto (opcional)' : 'Foto (opcional)'}
            </label>
            <CoverDropZone file={photo} onChange={setPhoto} />
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
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !name.trim()}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Agregar artista'}
          </button>
        </div>
      </div>
    </div>
  );
}
