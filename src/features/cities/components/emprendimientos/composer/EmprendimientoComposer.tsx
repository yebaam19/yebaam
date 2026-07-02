'use client';

/**
 * Create/edit form for an emprendimiento. Designed for a low-literacy
 * audience: one column, photo-first, spoken-question labels with examples,
 * large touch targets (text-base inputs, ≥48px), and only four required
 * fields. Everything else says "(si quieres)".
 *
 * One shared shell for both modes — pass `initial` to edit. On success the
 * user lands on the detail page, where PendingBanner explains the review.
 */

import { useState, useTransition, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  createEmprendimiento,
  updateEmprendimiento,
} from '@/features/cities/actions/emprendimientos.actions';
import type {
  EmprendimientoCategory,
  EmprendimientoDetail,
} from '@/features/cities/server/emprendimientos.server';
import { SingleImageField } from './SingleImageField';
import { MediaSlots, type MediaDraft } from './MediaSlots';
import { TipoVentaPicker } from './TipoVentaPicker';

const INPUT =
  'rounded-xl border border-neutral-300 bg-white px-4 py-3.5 text-base text-neutral-900 outline-none transition-colors focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100';

interface Props {
  cityId: string;
  citySlug: string;
  currentUserId: string | null;
  initial?: EmprendimientoDetail;
}

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-5 border-t border-neutral-100 pt-6 first:border-t-0 first:pt-0 dark:border-neutral-700">
      <legend className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-400">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
        {label}
      </span>
      {hint && <span className="text-sm text-neutral-500 dark:text-neutral-400">{hint}</span>}
      {children}
      {error && <span className="text-sm font-medium text-red-600 dark:text-red-400">{error}</span>}
    </label>
  );
}

export function EmprendimientoComposer({ cityId, citySlug, currentUserId, initial }: Props) {
  const t = useTranslations('cities.emprendimientos.composer');
  const router = useRouter();
  const editing = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? '');
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? '');
  const [story, setStory] = useState(initial?.story ?? '');
  const [zone, setZone] = useState(initial?.zone ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? initial?.whatsapp ?? '');
  const [category, setCategory] = useState<EmprendimientoCategory>(initial?.category ?? 'otro');
  const [heroCfImageId, setHeroCfImageId] = useState<string | null>(
    initial?.heroCfImageId ?? null,
  );
  const [ownerCfImageId, setOwnerCfImageId] = useState<string | null>(
    initial?.ownerCfImageId ?? null,
  );
  const [media, setMedia] = useState<MediaDraft[]>(
    (initial?.media ?? []).map((m) => ({
      type: m.type,
      cfImageId: m.cfImageId,
      cfStreamUid: m.cfStreamUid,
    })),
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!currentUserId) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 text-center shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">{t('signInRequired')}</p>
        <Link
          href={
            `/login?redirect=${encodeURIComponent(
              `/cities/${citySlug}/emprendimientos/new`,
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

    const trimmedName = name.trim();
    const trimmedDescription = shortDescription.trim();
    setNameError(trimmedName ? null : t('errors.nameRequired'));
    setDescriptionError(trimmedDescription ? null : t('errors.shortDescriptionRequired'));
    if (!trimmedName || !trimmedDescription) return;

    setError(null);
    startTransition(async () => {
      const payload = {
        cityId,
        name: trimmedName,
        shortDescription: trimmedDescription,
        story: story.trim() || null,
        category,
        zone: zone.trim() || null,
        address: address.trim() || null,
        // One form field feeds both columns: in Colombia the phone number IS
        // the WhatsApp number, and the audience shouldn't fill two inputs.
        phone: phone.trim() || null,
        whatsapp: phone.trim() || null,
        heroCfImageId,
        ownerCfImageId,
        media,
      };
      const out = initial
        ? await updateEmprendimiento({ ...payload, id: initial.id })
        : await createEmprendimiento(payload);
      if (!out.ok) {
        setError(t('errors.submitFailed'));
        return;
      }
      const id = initial ? initial.id : out.data.id;
      router.push(`/cities/${citySlug}/emprendimientos/${id}` as Route);
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-xl flex-col gap-6 rounded-2xl border border-neutral-200 bg-white px-5 py-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:px-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {editing ? t('editTitle') : t('title')}
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {editing ? t('reviewNoteEdit') : t('reviewNote')}
        </p>
      </div>

      <Group legend={t('groups.photos')}>
        <SingleImageField
          label={t('fields.heroLabel')}
          pickText={t('fields.heroHint')}
          changeText={t('fields.heroChange')}
          value={heroCfImageId}
          onChange={setHeroCfImageId}
          shape="wide"
          disabled={isPending}
        />
        <SingleImageField
          label={t('fields.ownerPhotoLabel')}
          hint={t('fields.ownerPhotoHint')}
          pickText={t('fields.ownerPhotoPick')}
          changeText={t('fields.heroChange')}
          value={ownerCfImageId}
          onChange={setOwnerCfImageId}
          shape="square"
          disabled={isPending}
        />
        <MediaSlots items={media} onChange={setMedia} disabled={isPending} />
      </Group>

      <Group legend={t('groups.about')}>
        <Field label={t('fields.nameLabel')} error={nameError}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('fields.namePlaceholder')}
            maxLength={120}
            aria-invalid={Boolean(nameError)}
            className={INPUT}
          />
        </Field>
        <Field label={t('fields.shortDescriptionLabel')} error={descriptionError}>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder={t('fields.shortDescriptionPlaceholder')}
            rows={3}
            maxLength={280}
            aria-invalid={Boolean(descriptionError)}
            className={`resize-y ${INPUT}`}
          />
        </Field>
        <Field label={t('fields.storyLabel')} hint={t('fields.storyHint')}>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={6}
            maxLength={5000}
            className={`resize-y ${INPUT}`}
          />
        </Field>
        <Field label={t('fields.zoneLabel')}>
          <input
            type="text"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder={t('fields.zonePlaceholder')}
            maxLength={160}
            className={INPUT}
          />
        </Field>
        <Field label={t('fields.addressLabel')} hint={t('fields.addressHint')}>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={200}
            className={INPUT}
          />
        </Field>
        <TipoVentaPicker value={category} onChange={setCategory} disabled={isPending} />
      </Group>

      <Group legend={t('groups.contact')}>
        <Field label={t('fields.phoneLabel')} hint={t('fields.phoneHint')}>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            className={INPUT}
          />
        </Field>
      </Group>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={`/cities/${citySlug}/emprendimientos` as Route}
          className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-base font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          {t('actions.cancel')}
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isPending
            ? editing
              ? t('actions.saving')
              : t('actions.submitting')
            : editing
              ? t('actions.save')
              : t('actions.submit')}
        </button>
      </div>
    </form>
  );
}
