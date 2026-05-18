'use client';

/**
 * ClassifiedComposer — client shell for posting a new city classified.
 *
 * Splits the heavy concerns into children (per CLAUDE.md):
 *   - <ImageUploader> owns multi-image Cloudflare uploads + previews
 *   - this shell owns text fields, kind/price, validation and the action
 *
 * Posts via the `postClassified` Server Action; on success, redirects to
 * the detail page so the user sees their post in context. Validation
 * happens client-side first (fast feedback), but the server-side action
 * re-validates and returns `{ ok: false, error }` for any drift.
 */

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { postClassified } from '@/features/cities/actions/classifieds.actions';
import type { ClassifiedKind } from '@/features/cities/server/classifieds.server';
import { ImageUploader } from './ClassifiedComposer/ImageUploader';

const KINDS: ClassifiedKind[] = ['offer', 'want', 'trade', 'free'];

interface ClassifiedComposerProps {
  cityId: string;
  citySlug: string;
  currentUserId: string | null;
}

export function ClassifiedComposer({
  cityId,
  citySlug,
  currentUserId,
}: ClassifiedComposerProps) {
  const t = useTranslations('cities.classifieds.composer');
  const tKind = useTranslations('cities.classifieds.kinds');
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<ClassifiedKind>('offer');
  const [priceInput, setPriceInput] = useState('');
  const [cfImageIds, setCfImageIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
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
              `/cities/${citySlug}/classifieds/new`,
            )}` as Route
          }
          className="mt-3 inline-flex rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          {t('signInCta')}
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t('errors.titleRequired'));
      return;
    }
    let priceCents: number | null = null;
    if (priceInput.trim()) {
      const numeric = Number(priceInput.replace(/[^0-9.]/g, ''));
      if (!Number.isFinite(numeric) || numeric < 0) {
        setError(t('errors.invalidPrice'));
        return;
      }
      priceCents = Math.round(numeric * 100);
    }

    setError(null);
    startTransition(async () => {
      const out = await postClassified({
        cityId,
        title: trimmedTitle,
        description: description.trim(),
        kind,
        priceCents,
        cfImageIds,
      });
      if (!out.ok) {
        setError(t('errors.submitFailed'));
        return;
      }
      router.push(`/cities/${citySlug}/classifieds/${out.data.id}` as Route);
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {t('fields.kindLabel')}
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ClassifiedKind)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {tKind(k)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {t('fields.priceLabel')}
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            placeholder={t('fields.pricePlaceholder')}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
      </div>
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
      <ImageUploader
        cfImageIds={cfImageIds}
        onChange={setCfImageIds}
        disabled={isPending}
      />
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Link
          href={`/cities/${citySlug}/classifieds` as Route}
          className="inline-flex items-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          {t('actions.cancel')}
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isPending ? t('actions.submitting') : t('actions.submit')}
        </button>
      </div>
    </form>
  );
}
