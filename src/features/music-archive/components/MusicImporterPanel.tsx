'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations, useLocale } from 'next-intl';
import { extractFromUrl, confirmImport } from '../actions/import.actions';
import type {
  DetectedAlbumPreview as DetectedAlbum,
  ExtractedImportPreview,
} from '../types/music.types';

interface RecentImport {
  id: string;
  source: string;
  source_url: string;
  status: string;
  created_album_id: string | null;
  error_detail: string | null;
  created_at: string;
}

interface Props {
  recentImports: RecentImport[];
  recentError: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  processing: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  imported: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  failed: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  skipped: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

export function MusicImporterPanel({ recentImports, recentError }: Props) {
  const t = useTranslations('musica.importer');
  const locale = useLocale();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExtractedImportPreview | null>(null);
  const [edits, setEdits] = useState<Partial<DetectedAlbum>>({});
  const [pending, startTransition] = useTransition();
  const [confirming, startConfirm] = useTransition();

  function onAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPreview(null);
    setEdits({});
    if (!url.trim()) return;
    startTransition(async () => {
      const res = await extractFromUrl(url.trim());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPreview(res.data);
    });
  }

  function onConfirm() {
    if (!preview) return;
    setError(null);
    startConfirm(async () => {
      const res = await confirmImport(preview.importId, edits);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/musica/albumes/${res.data.albumSlug}` as Route);
    });
  }

  const merged: DetectedAlbum = preview
    ? { ...preview.detected, ...edits }
    : ({} as DetectedAlbum);

  return (
    <div className="space-y-6">
      <form
        onSubmit={onAnalyze}
        className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {t('urlLabel')}
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('urlPlaceholder')}
            required
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={pending || !url.trim()}
            className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {pending ? t('submitting') : t('submit')}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">
          {t('hint')}
        </p>
      </form>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {preview && (
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
              onChange={(v) => setEdits({ ...edits, artist_name: v })}
              required
            />
            <Field
              label={t('fieldAlbum')}
              value={merged.album_title ?? ''}
              onChange={(v) => setEdits({ ...edits, album_title: v })}
              required
            />
            <Field
              label={t('fieldYear')}
              type="number"
              value={merged.year != null ? String(merged.year) : ''}
              onChange={(v) => setEdits({ ...edits, year: v ? Number(v) : null })}
            />
            <Field
              label={t('fieldCountry')}
              value={merged.country ?? ''}
              onChange={(v) => setEdits({ ...edits, country: v.toUpperCase().slice(0, 2) || null })}
            />
            <Field
              label={t('fieldLabel')}
              value={merged.label ?? ''}
              onChange={(v) => setEdits({ ...edits, label: v || null })}
            />
            <Field
              label={t('fieldCatalog')}
              value={merged.catalog_number ?? ''}
              onChange={(v) => setEdits({ ...edits, catalog_number: v || null })}
            />
          </div>

          {merged.cover_image_url && (
            <div className="mt-4">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('detectedCover')}</p>
              <img
                src={merged.cover_image_url}
                alt=""
                className="mt-1 h-32 w-32 rounded-md border border-zinc-200 object-cover dark:border-zinc-700"
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
              onClick={() => {
                setPreview(null);
                setEdits({});
              }}
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
      )}

      <section>
        <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {t('recentHeading')}
        </h2>
        {recentError && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {recentError}
          </p>
        )}
        {recentImports.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40">
            {t('recentEmpty')}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50">
                <tr>
                  <th className="px-3 py-2">{t('colDate')}</th>
                  <th className="px-3 py-2">{t('colSource')}</th>
                  <th className="px-3 py-2">{t('colStatus')}</th>
                  <th className="px-3 py-2">{t('colUrl')}</th>
                  <th className="px-3 py-2">{t('colAlbum')}</th>
                </tr>
              </thead>
              <tbody>
                {recentImports.map((imp) => (
                  <tr
                    key={imp.id}
                    className="border-t border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <td className="px-3 py-2 tabular-nums text-zinc-500">
                      {new Date(imp.created_at).toLocaleString(locale, {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{imp.source}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          STATUS_BADGE[imp.status] ?? STATUS_BADGE.pending
                        }`}
                      >
                        {imp.status}
                      </span>
                    </td>
                    <td className="max-w-xs px-3 py-2">
                      <a
                        href={imp.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-amber-700 hover:underline dark:text-amber-400"
                        title={imp.source_url}
                      >
                        {imp.source_url}
                      </a>
                    </td>
                    <td className="px-3 py-2">
                      {imp.created_album_id ? (
                        <Link
                          href={`/musica` as Route}
                          className="text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                          {t('viewAlbum')}
                        </Link>
                      ) : imp.error_detail ? (
                        <span className="text-rose-600" title={imp.error_detail}>
                          {imp.error_detail.slice(0, 40)}…
                        </span>
                      ) : (
                        t('emptyDash')
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
