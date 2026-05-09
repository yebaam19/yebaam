'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CameraIcon } from '@/components/icons/heroicons-shim';
import { uploadService } from '@/lib/service/upload.service';
import { addPhoto } from '../actions/families.actions';
import type { FamilyPersonRow } from '../types/family.types';

interface Props {
  familyId: string;
  persons: FamilyPersonRow[];
}

export function UploadPhotoDialog({ familyId, persons }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [takenAt, setTakenAt] = useState('');
  const [taggedIds, setTaggedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setFile(null);
    setCaption('');
    setTakenAt('');
    setTaggedIds(new Set());
    setError(null);
    setProgress(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  function toggleTag(id: string) {
    setTaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Selecciona una imagen.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.');
      return;
    }
    let cfImageId: string;
    try {
      setProgress(0);
      const result = await uploadService.uploadImage(file, (p) => setProgress(p));
      cfImageId = result.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falló la subida.');
      setProgress(null);
      return;
    }

    startTransition(async () => {
      const res = await addPhoto({
        familyId,
        cfImageId,
        caption: caption.trim() || undefined,
        takenAt: takenAt || undefined,
        personIds: Array.from(taggedIds),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        <CameraIcon className="h-4 w-4" />
        Subir foto
      </button>
    );
  }

  const busy = pending || progress !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Subir foto familiar</h3>
        <p className="mt-1 text-xs text-zinc-500">Las fotos se almacenan en Cloudflare y solo son visibles para los miembros de la familia.</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Imagen <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 dark:text-zinc-300 dark:file:bg-emerald-900/30 dark:file:text-emerald-300"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Descripción</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={300}
              placeholder="Ej. Reunión navideña 2010"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Fecha de la foto</label>
            <input
              type="date"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          {persons.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Personas etiquetadas ({taggedIds.size})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {persons.map((p) => {
                  const active = taggedIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleTag(p.id)}
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        active
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {p.full_name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {progress !== null && progress < 100 && (
            <div className="text-xs text-zinc-500">Subiendo a Cloudflare… {progress}%</div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || !file}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? 'Guardando…' : 'Subir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
