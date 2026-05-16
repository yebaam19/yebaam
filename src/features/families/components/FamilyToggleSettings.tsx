'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { updateFamily } from '../actions/families.actions';
import type { FamilyWithViewer } from '../types/family.types';

type ToggleKey =
  | 'invite'
  | 'addPersons'
  | 'addEvents'
  | 'addPhotos'
  | 'addStories'
  | 'addDocuments';

interface ToggleDef {
  field: keyof Pick<
    FamilyWithViewer,
    | 'member_can_invite'
    | 'member_can_add_persons'
    | 'member_can_add_events'
    | 'member_can_add_photos'
    | 'member_can_add_stories'
    | 'member_can_add_documents'
  >;
  i18nKey: ToggleKey;
  dtoKey:
    | 'memberCanInvite'
    | 'memberCanAddPersons'
    | 'memberCanAddEvents'
    | 'memberCanAddPhotos'
    | 'memberCanAddStories'
    | 'memberCanAddDocuments';
}

const TOGGLES: ToggleDef[] = [
  { field: 'member_can_invite', dtoKey: 'memberCanInvite', i18nKey: 'invite' },
  { field: 'member_can_add_persons', dtoKey: 'memberCanAddPersons', i18nKey: 'addPersons' },
  { field: 'member_can_add_events', dtoKey: 'memberCanAddEvents', i18nKey: 'addEvents' },
  { field: 'member_can_add_photos', dtoKey: 'memberCanAddPhotos', i18nKey: 'addPhotos' },
  { field: 'member_can_add_stories', dtoKey: 'memberCanAddStories', i18nKey: 'addStories' },
  { field: 'member_can_add_documents', dtoKey: 'memberCanAddDocuments', i18nKey: 'addDocuments' },
];

export function FamilyToggleSettings({ family }: { family: FamilyWithViewer }) {
  const router = useRouter();
  const t = useTranslations('familias.toggleSettings');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);

  function handleToggle(toggle: ToggleDef, next: boolean) {
    setError(null);
    setSavingField(toggle.field);
    startTransition(async () => {
      const res = await updateFamily({ id: family.id, [toggle.dtoKey]: next });
      if (!res.ok) setError(res.error);
      setSavingField(null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        {t.rich('intro', {
          semibold: (chunks) => <span className="font-semibold">{chunks}</span>,
        })}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {TOGGLES.map((toggle) => {
          const value = family[toggle.field];
          const isSaving = pending && savingField === toggle.field;
          return (
            <label
              key={toggle.field}
              className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <input
                type="checkbox"
                checked={value}
                disabled={pending}
                onChange={(e) => handleToggle(toggle, e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {t(`items.${toggle.i18nKey}.label`)}
                  {isSaving && <span className="ml-2 text-xs font-normal text-zinc-500">{t('saving')}</span>}
                </p>
                <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{t(`items.${toggle.i18nKey}.hint`)}</p>
              </div>
            </label>
          );
        })}
      </div>
      {error && (
        <div className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
          {error}
        </div>
      )}
    </div>
  );
}
