'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { imageUrl } from '@/lib/media/urls';
import { updateFamily } from '../actions/families.actions';
import type { FamilyWithViewer } from '../types/family.types';

export function EditFamilyForm({ family }: { family: FamilyWithViewer }) {
  const router = useRouter();
  const t = useTranslations('familias.editForm');
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(family.name);
  const [description, setDescription] = useState(family.description ?? '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const currentCover = !removeCover && family.cover_cf_image_id
    ? imageUrl(family.cover_cf_image_id, 'cover')
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    let coverImageId: string | null | undefined = undefined;
    if (coverFile) {
      try {
        setUploading(true);
        const r = await uploadService.uploadImage(coverFile);
        coverImageId = r.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.uploadFailed'));
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    } else if (removeCover && family.cover_cf_image_id) {
      coverImageId = null;
    }

    startTransition(async () => {
      const res = await updateFamily({
        id: family.id,
        name: name !== family.name ? name : undefined,
        description: description !== (family.description ?? '') ? description : undefined,
        coverImageId,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOkMessage(t('savedMessage'));
      setCoverFile(null);
      setRemoveCover(false);
      router.refresh();
    });
  }

  const busy = pending || uploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t('fields.nameLabel')}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t('fields.descriptionLabel')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={400}
          rows={3}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t('fields.coverLabel')}
        </label>
        {currentCover && (
          <img
            src={currentCover}
            alt=""
            className="mb-2 h-28 w-full rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setCoverFile(e.target.files?.[0] ?? null);
            setRemoveCover(false);
          }}
          className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 dark:text-zinc-300 dark:file:bg-emerald-900/30 dark:file:text-emerald-300"
        />
        {family.cover_cf_image_id && !coverFile && (
          <label className="mt-2 inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={removeCover}
              onChange={(e) => setRemoveCover(e.target.checked)}
            />
            {t('fields.removeCurrentCover')}
          </label>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
          {error}
        </div>
      )}
      {okMessage && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          {okMessage}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? t('submitting') : t('submit')}
        </button>
      </div>
    </form>
  );
}
