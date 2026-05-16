'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createLabel, updateLabel } from '../../../actions/labels.actions';
import type { MusicLabelRow } from '../../../types/music.types';
import { COUNTRIES, inputCls, sortCountryCodesByLabel } from '../../upload/constants';

interface InitialValues {
  id?: string;
  name?: string;
  country?: string | null;
  founded?: number | null;
}

interface Props {
  /** Pass an existing row → edit mode. Omit → create mode. */
  initial?: InitialValues;
  onClose: () => void;
  onSaved: (row: MusicLabelRow) => void;
}

/** Single dialog shared by the create / edit label flows. */
export function LabelFormDialog({ initial, onClose, onSaved }: Props) {
  const t = useTranslations('musica');
  const isEdit = Boolean(initial?.id);
  const sortedCountries = useMemo(
    () => sortCountryCodesByLabel(COUNTRIES, (code) => t(`countries.${code}` as const)),
    [t],
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [country, setCountry] = useState(initial?.country ?? '');
  const [founded, setFounded] = useState(initial?.founded?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = isEdit && initial?.id
      ? await updateLabel(initial.id, {
          name: name.trim(),
          country: country || null,
          founded: founded ? Number(founded) : null,
        })
      : await createLabel({
          name: name.trim(),
          country: country || undefined,
          founded: founded ? Number(founded) : undefined,
        });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSaved(res.data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <h3 className="mb-4 text-lg font-semibold">
          {isEdit ? t('admin.labelEditor.editTitle') : t('admin.labelEditor.newTitle')}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {t('admin.labelEditor.name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              maxLength={120}
              placeholder={t('upload.labelPlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {t('admin.labelEditor.country')}
            </label>
            <select
              value={country ?? ''}
              onChange={(e) => setCountry(e.target.value)}
              className={inputCls}
            >
              <option value="">{t('upload.fieldEmpty')}</option>
              {sortedCountries.map((code) => (
                <option key={code} value={code}>
                  {t(`countries.${code}` as const)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {t('admin.labelEditor.founded')}
            </label>
            <input
              type="number"
              value={founded}
              onChange={(e) => setFounded(e.target.value)}
              className={inputCls}
              min={1800}
              max={2100}
            />
          </div>
        </div>
        {error && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
          >
            {t('admin.cancel')}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !name.trim()}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {saving ? t('admin.labelEditor.submitting') : t('admin.labelEditor.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
