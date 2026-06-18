'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { PencilSquareIcon } from '@/components/icons/heroicons-shim';
import { updateClubAction } from '@/features/clubs/server/clubs.actions';
import type { Club, ClubPrivacy } from '@/features/clubs/types/club.types';
import { formatDate } from '@/features/clubs/utils/clubHelpers';

function rulesToDrafts(rules: string[] | undefined): string[] {
  if (!rules?.length) return [''];
  return rules;
}

function buildDraftFromClub(club: Club) {
  return {
    description: club.description,
    subcategory: club.subcategory ?? '',
    location: club.location ?? '',
    website: club.website ?? '',
    privacy: club.privacy,
    ruleDrafts: rulesToDrafts(club.rules),
  };
}

interface ClubDetailsEditFormProps {
  club: Club;
  onCancel: () => void;
  onSaved?: () => void;
}

export function ClubDetailsEditForm({ club, onCancel, onSaved }: ClubDetailsEditFormProps) {
  const t = useTranslations('clubes.editDetails');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initial = buildDraftFromClub(club);

  const [description, setDescription] = useState(initial.description);
  const [subcategory, setSubcategory] = useState(initial.subcategory);
  const [location, setLocation] = useState(initial.location);
  const [website, setWebsite] = useState(initial.website);
  const [privacy, setPrivacy] = useState<ClubPrivacy>(initial.privacy);
  const [ruleDrafts, setRuleDrafts] = useState<string[]>(initial.ruleDrafts);

  const isEducative = club.category === 'EDUCATIVO';

  function handleCancel() {
    onCancel();
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateClubAction(club.id, {
        description: description.trim(),
        subcategory: subcategory.trim() || undefined,
        location: location.trim() || undefined,
        website: website.trim() || undefined,
        privacy,
        rules: ruleDrafts.map((r) => r.trim()).filter(Boolean),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t('saved'));
      onSaved?.();
      router.refresh();
    });
  }

  function setRule(i: number, value: string) {
    setRuleDrafts((prev) => prev.map((r, idx) => (idx === i ? value : r)));
  }

  function addRule() {
    setRuleDrafts((prev) => [...prev, '']);
  }

  function removeRule(i: number) {
    setRuleDrafts((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('descriptionLabel')} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={500}
          required
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t('descriptionCounter', { count: description.length })}
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {isEducative ? t('schoolLabel') : t('subcategoryLabel')}
        </label>
        <input
          type="text"
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          placeholder={isEducative ? t('schoolPlaceholder') : t('subcategoryPlaceholder')}
          maxLength={100}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('locationLabel')}
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('locationPlaceholder')}
            maxLength={120}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('websiteLabel')}
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder={t('websitePlaceholder')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('privacyLabel')}
        </label>
        <select
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value as ClubPrivacy)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="PUBLIC">{t('privacyPublic')}</option>
          <option value="PRIVATE">{t('privacyPrivate')}</option>
        </select>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('rulesLabel')}
          </label>
          <button
            type="button"
            onClick={addRule}
            className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            {t('addRule')}
          </button>
        </div>
        <ul className="space-y-2">
          {ruleDrafts.map((rule, i) => (
            <li key={i} className="flex gap-2">
              <input
                type="text"
                value={rule}
                onChange={(e) => setRule(i, e.target.value)}
                placeholder={t('rulePlaceholder')}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={() => removeRule(i)}
                className="shrink-0 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t('removeRule')}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
        <button
          type="button"
          onClick={handleCancel}
          disabled={pending}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={pending || !description.trim()}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {pending ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  );
}

interface EditClubDetailsModalProps {
  club: Club;
  onClose: () => void;
}

export function EditClubDetailsModal({ club, onClose }: EditClubDetailsModalProps) {
  const t = useTranslations('clubes.editDetails');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-club-title"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h2
          id="edit-club-title"
          className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
        >
          {t('title')}
        </h2>
        <ClubDetailsEditForm
          key={club.updatedAt.toString()}
          club={club}
          onCancel={onClose}
          onSaved={onClose}
        />
      </div>
    </div>
  );
}

export function ClubAboutSection({
  club,
  canManage,
}: {
  club: Club;
  canManage: boolean;
}) {
  const t = useTranslations('clubes.editDetails');
  const tAbout = useTranslations('clubes.detail');
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {tAbout('aboutHeading')}
        </h2>
        {canManage && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <PencilSquareIcon className="h-3.5 w-3.5" />
            {t('editButton')}
          </button>
        )}
      </div>

      {editing ? (
        <ClubDetailsEditForm
          key={club.updatedAt.toString()}
          club={club}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      ) : (
        <>
          <p className="leading-relaxed text-gray-700 dark:text-gray-300">{club.description}</p>

          {club.subcategory && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {club.category === 'EDUCATIVO' ? t('schoolLabel') : t('subcategoryLabel')}:{' '}
              <span className="font-medium text-gray-900 dark:text-white">{club.subcategory}</span>
            </p>
          )}

          {club.rules && club.rules.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                {t('rulesHeading')}
              </h3>
              <ol className="list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {club.rules.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ol>
            </div>
          )}

          {club.tags && club.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {club.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {tAbout('createdOn', { date: formatDate(new Date(club.createdAt)) })}
          </div>
        </>
      )}
    </div>
  );
}
