'use client';

import { useState, useTransition } from 'react';
import { uploadService } from '@/lib/service/upload.service';
import { updateClubProfile } from '../../../actions/club-admin.actions';

interface ClubRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  rules: string[];
  cover_image_url: string | null;
}

interface Props {
  club: ClubRow;
  onClose: () => void;
  onSaved: (next: ClubRow) => void;
}

export function AdminClubEditModal({ club, onClose, onSaved }: Props) {
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description);
  const [rules, setRules] = useState<string[]>(club.rules.length ? club.rules : ['']);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setRule(i: number, value: string) {
    setRules((prev) => prev.map((r, idx) => (idx === i ? value : r)));
  }
  function addRule() {
    setRules((prev) => [...prev, '']);
  }
  function removeRule(i: number) {
    setRules((prev) => prev.filter((_, idx) => idx !== i));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        let coverCfImageId: string | null | undefined = undefined;
        if (coverFile) {
          const up = await uploadService.uploadImage(coverFile);
          coverCfImageId = up.id;
        }
        const cleanRules = rules.map((r) => r.trim()).filter(Boolean);
        const res = await updateClubProfile(club.id, {
          name,
          description,
          rules: cleanRules,
          ...(coverCfImageId !== undefined ? { coverCfImageId } : {}),
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        onSaved({
          ...club,
          name,
          description,
          rules: cleanRules,
          cover_image_url: coverCfImageId ?? club.cover_image_url,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo guardar.');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Editar club</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Reglas
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
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={addRule}
              className="mt-2 text-xs text-amber-700 hover:underline dark:text-amber-300"
            >
              + Agregar regla
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Imagen de portada
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
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
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending || !name.trim()}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
          >
            {pending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { ClubRow as AdminClubEditRow };
