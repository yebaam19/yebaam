'use client';

/**
 * HelpComposer — single-image variant of the classified composer for the
 * social-help feature. Differences from the classifieds composer:
 *   - Singular `cf_image_id` (only one image per row in the schema).
 *   - Two kinds (`offer` | `need`) rendered as a radio-style toggle so the
 *     intent (offering vs needing) is unambiguous before the user types.
 *   - No price field.
 */

import { useState, useTransition, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim';
import { uploadService } from '@/lib/service/upload.service';
import { postHelp } from '@/features/cities/actions/social-help.actions';
import type { HelpKind } from '@/features/cities/server/social-help.server';

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';
const KINDS: HelpKind[] = ['offer', 'need'];

interface HelpComposerProps {
  cityId: string;
  citySlug: string;
  currentUserId: string | null;
}

export function HelpComposer({
  cityId,
  citySlug,
  currentUserId,
}: HelpComposerProps) {
  const t = useTranslations('cities.socialHelp.composer');
  const tKind = useTranslations('cities.socialHelp.kinds');
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<HelpKind>('offer');
  const [cfImageId, setCfImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!currentUserId) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 text-center shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {t('signInRequired')}
        </p>
        <Link
          href={
            `/login?redirect=${encodeURIComponent(
              `/cities/${citySlug}/social-help/new`,
            )}` as Route
          }
          className="mt-3 inline-flex rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          {t('signInCta')}
        </Link>
      </div>
    );
  }

  const handlePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { id } = await uploadService.uploadImage(file);
      setCfImageId(id);
    } catch (err) {
      console.error('[HelpComposer] upload failed', err);
      setError(t('errors.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = cfImageId && CF_HASH
    ? `https://imagedelivery.net/${CF_HASH}/${cfImageId}/public`
    : null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending || uploading) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t('errors.titleRequired'));
      return;
    }
    setError(null);
    startTransition(async () => {
      const out = await postHelp({
        cityId,
        title: trimmedTitle,
        description: description.trim(),
        kind,
        cfImageId,
      });
      if (!out.ok) {
        setError(t('errors.submitFailed'));
        return;
      }
      router.push(`/cities/${citySlug}/social-help/${out.data.id}` as Route);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-2xl flex-col gap-5 rounded-2xl border border-neutral-200 bg-white px-5 py-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:px-6"
    >
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {t('title')}
      </h2>

      <fieldset className="flex gap-2">
        <legend className="sr-only">{t('fields.kindLabel')}</legend>
        {KINDS.map((k) => {
          const active = k === kind;
          return (
            <label
              key={k}
              className={
                active
                  ? 'flex-1 cursor-pointer rounded-xl border-2 border-primary-500 bg-primary-50 px-3 py-3 text-center text-sm font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'flex-1 cursor-pointer rounded-xl border border-neutral-300 bg-white px-3 py-3 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
              }
            >
              <input
                type="radio"
                name="kind"
                value={k}
                checked={active}
                onChange={() => setKind(k)}
                className="sr-only"
              />
              {tKind(k)}
            </label>
          );
        })}
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {t('fields.titleLabel')}
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('fields.titlePlaceholder')}
          maxLength={200}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {t('fields.descriptionLabel')}
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('fields.descriptionPlaceholder')}
          rows={5}
          maxLength={5000}
          className="resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {t('fields.imageLabel')}
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('fields.imageHint')}
        </span>
        <div className="flex items-center gap-2">
          {previewUrl ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setCfImageId(null)}
                aria-label={t('actions.removeImage')}
                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label
              className={
                uploading || isPending
                  ? 'flex h-24 w-24 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400 dark:border-neutral-600 dark:bg-neutral-900'
                  : 'flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-500 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-400'
              }
            >
              {uploading ? (
                <PhotoIcon className="h-5 w-5 animate-pulse" />
              ) : (
                <PlusIcon className="h-5 w-5" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePick}
                disabled={uploading || isPending}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Link
          href={`/cities/${citySlug}/social-help` as Route}
          className="inline-flex items-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          {t('actions.cancel')}
        </Link>
        <button
          type="submit"
          disabled={isPending || uploading}
          className="inline-flex items-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isPending ? t('actions.submitting') : t('actions.submit')}
        </button>
      </div>
    </form>
  );
}
