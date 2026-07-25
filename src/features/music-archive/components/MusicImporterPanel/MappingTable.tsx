import { useTranslations } from 'next-intl';
import type { DetectedAlbumPreview as DetectedAlbum } from '../../types/music.types';

interface Props {
  merged: DetectedAlbum;
  confirming: boolean;
  onFieldChange: (patch: Partial<DetectedAlbum>) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function MappingTable({ merged, confirming, onFieldChange, onCancel, onConfirm }: Props) {
  const t = useTranslations('musica.importer');

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {t('detectedHeading')}
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500">
        {t('detectedHint')}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label={t('fieldArtist')}
          value={merged.artist_name ?? ''}
          onChange={(v) => onFieldChange({ artist_name: v })}
          required
        />
        <Field
          label={t('fieldAlbum')}
          value={merged.album_title ?? ''}
          onChange={(v) => onFieldChange({ album_title: v })}
          required
        />
        <Field
          label={t('fieldYear')}
          type="number"
          value={merged.year != null ? String(merged.year) : ''}
          onChange={(v) => onFieldChange({ year: v ? Number(v) : null })}
        />
        <Field
          label={t('fieldCountry')}
          value={merged.country ?? ''}
          onChange={(v) => onFieldChange({ country: v.toUpperCase().slice(0, 2) || null })}
        />
        <Field
          label={t('fieldLabel')}
          value={merged.label ?? ''}
          onChange={(v) => onFieldChange({ label: v || null })}
        />
        <Field
          label={t('fieldCatalog')}
          value={merged.catalog_number ?? ''}
          onChange={(v) => onFieldChange({ catalog_number: v || null })}
        />
      </div>

      {merged.cover_image_url && (
        <div className="mt-4">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('detectedCover')}</p>
          <img
            src={merged.cover_image_url}
            alt=""
            className="mt-1 h-32 w-32 rounded-md border border-zinc-200 object-cover dark:border-zinc-700"
            decoding="async"
            loading="lazy"
          />
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {t('tracksDetected', { count: merged.tracks?.length ?? 0 })}
        </p>
        <ul className="mt-2 max-h-72 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          {(merged.tracks ?? []).map((tr, i) => (
            <li
              key={i}
              className="flex items-center gap-3 border-b border-zinc-100 px-3 py-2 text-xs last:border-0 dark:border-zinc-800"
            >
              <span className="w-8 text-right tabular-nums text-zinc-500">
                {tr.position ?? i + 1}
              </span>
              <span className="flex-1 truncate text-zinc-900 dark:text-zinc-100">{tr.title}</span>
              {tr.duration_seconds != null && (
                <span className="tabular-nums text-zinc-500">
                  {Math.floor(tr.duration_seconds / 60)}:
                  {String(tr.duration_seconds % 60).padStart(2, '0')}
                </span>
              )}
              <a
                href={tr.audio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-amber-700 hover:underline dark:text-amber-400"
                title={tr.audio_url}
              >
                {t('audioLink')}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirming}
          className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {confirming ? t('confirming') : t('confirm')}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: 'text' | 'number';
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
    </div>
  );
}
