'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentIcon } from '@/components/icons/heroicons-shim';
import { supabase } from '@/utils/supabase/client';
import { uploadService } from '@/lib/service/upload.service';
import { addDocument } from '../actions/families.actions';
import type { FamilyDocKind } from '../types/family.types';

const KIND_OPTIONS: Array<{ value: FamilyDocKind; label: string }> = [
  { value: 'birth_cert', label: 'Acta de nacimiento' },
  { value: 'marriage_cert', label: 'Acta de matrimonio' },
  { value: 'death_cert', label: 'Acta de defunción' },
  { value: 'id', label: 'Identificación' },
  { value: 'letter', label: 'Carta' },
  { value: 'other', label: 'Otro' },
];

export function UploadDocumentDialog({ familyId }: { familyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<FamilyDocKind>('other');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setFile(null);
    setTitle('');
    setKind('other');
    setError(null);
    setProgress(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Selecciona un archivo (imagen o PDF).');
      return;
    }
    if (!title.trim()) {
      setError('El título es obligatorio.');
      return;
    }

    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      setError('Solo se permiten imágenes (JPG/PNG) o PDFs.');
      return;
    }

    let storagePath: string | undefined;
    let cfImageId: string | undefined;

    try {
      if (isImage) {
        setProgress('Subiendo a Cloudflare…');
        const result = await uploadService.uploadImage(file);
        cfImageId = result.id;
      } else {
        // PDF → Supabase Storage privado, path <familyId>/<uuid>.pdf
        setProgress('Subiendo PDF a almacenamiento privado…');
        const path = `${familyId}/${crypto.randomUUID()}.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from('family-documents')
          .upload(path, file, { contentType: 'application/pdf', upsert: false });
        if (uploadErr) {
          throw new Error(uploadErr.message);
        }
        storagePath = path;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falló la subida.');
      setProgress(null);
      return;
    }

    startTransition(async () => {
      const res = await addDocument({
        familyId,
        title: title.trim(),
        kind,
        storagePath,
        cfImageId,
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
        <DocumentIcon className="h-4 w-4" />
        Subir documento
      </button>
    );
  }

  const busy = pending || progress !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Subir documento familiar
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          PDFs van a almacenamiento privado (URL firmada al descargar). Las imágenes van a Cloudflare.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Título <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Ej. Acta de nacimiento de María"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as FamilyDocKind)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Archivo <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 dark:text-zinc-300 dark:file:bg-emerald-900/30 dark:file:text-emerald-300"
              required
            />
            <p className="mt-1 text-[10px] text-zinc-500">Imágenes (JPG/PNG) o PDFs.</p>
          </div>

          {progress && (
            <div className="text-xs text-zinc-500">{progress}</div>
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
              disabled={busy || !file || !title.trim()}
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
