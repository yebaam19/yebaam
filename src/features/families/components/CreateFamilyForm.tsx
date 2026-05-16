'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { createFamily } from '../actions/families.actions';

export function CreateFamilyForm() {
  const t = useTranslations('familias');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError(t('create.errors.nameRequired'));
      return;
    }
    let coverImageId: string | undefined;
    if (coverFile) {
      try {
        setUploading(true);
        const result = await uploadService.uploadImage(coverFile);
        coverImageId = result.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : t('create.errors.uploadFailed'));
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    startTransition(async () => {
      const res = await createFamily({
        name: name.trim(),
        description: description.trim() || undefined,
        coverImageId,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/feed/familias/${res.data.slug}`);
      router.refresh();
    });
  }

  const busy = pending || uploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t('create.fields.nameLabel')} <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder={t('create.fields.namePlaceholder')}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t('create.fields.descriptionLabel')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={400}
          rows={3}
          placeholder={t('create.fields.descriptionPlaceholder')}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t('create.fields.coverLabel')}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 dark:text-zinc-300 dark:file:bg-emerald-900/30 dark:file:text-emerald-300"
        />
        <p className="mt-1 text-xs text-zinc-500">{t('create.fields.coverHint')}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          {t('create.privacyNote')}
        </p>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? t('create.actions.submitting') : t('create.actions.submit')}
        </button>
      </div>
    </form>
  );
}
