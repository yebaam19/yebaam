'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LinkIcon } from '@/components/icons/heroicons-shim';
import { linkRelationship } from '../actions/families.actions';
import type { FamilyPersonRow, FamilyRelationshipKind } from '../types/family.types';

interface Props {
  familyId: string;
  persons: FamilyPersonRow[];
}

const KIND_VALUES: FamilyRelationshipKind[] = ['parent', 'spouse', 'sibling'];

export function LinkRelationshipDialog({ familyId, persons }: Props) {
  const t = useTranslations('familias.linkRelationship');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FamilyRelationshipKind>('parent');
  const [personA, setPersonA] = useState<string>('');
  const [personB, setPersonB] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setKind('parent');
    setPersonA('');
    setPersonB('');
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!personA || !personB) {
      setError(t('errors.selectTwo'));
      return;
    }
    if (personA === personB) {
      setError(t('errors.mustDiffer'));
      return;
    }
    startTransition(async () => {
      const res = await linkRelationship({
        familyId,
        personId: personA,
        relatedPersonId: personB,
        type: kind,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  if (persons.length < 2) {
    return null;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
      >
        <LinkIcon className="h-4 w-4" />
        {t('trigger')}
      </button>
    );
  }

  const labelA =
    kind === 'parent' ? t('labels.parentA') : kind === 'spouse' ? t('labels.spouseA') : t('labels.siblingA');
  const labelB =
    kind === 'parent' ? t('labels.parentB') : kind === 'spouse' ? t('labels.spouseB') : t('labels.siblingB');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {t('title')}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {t('kindLabel')}
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as FamilyRelationshipKind)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {KIND_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(`kindOptions.${value}.label`)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-zinc-500">
              {t(`kindOptions.${kind}.help`)}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {labelA}
            </label>
            <select
              value={personA}
              onChange={(e) => setPersonA(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">{t('selectPlaceholder')}</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {labelB}
            </label>
            <select
              value={personB}
              onChange={(e) => setPersonB(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">{t('selectPlaceholder')}</option>
              {persons
                .filter((p) => p.id !== personA)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={pending || !personA || !personB}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending ? t('submitting') : t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
