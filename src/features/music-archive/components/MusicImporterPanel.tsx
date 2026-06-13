'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { extractFromUrl, confirmImport } from '../actions/import.actions';
import type {
  DetectedAlbumPreview as DetectedAlbum,
  ExtractedImportPreview,
} from '../types/music.types';
import { ImportSourceForm } from './MusicImporterPanel/ImportSourceForm';
import { MappingTable } from './MusicImporterPanel/MappingTable';
import { RecentImports, type RecentImport } from './MusicImporterPanel/RecentImports';

interface Props {
  recentImports: RecentImport[];
  recentError: string | null;
}

export function MusicImporterPanel({ recentImports, recentError }: Props) {
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
      <ImportSourceForm url={url} pending={pending} onUrlChange={setUrl} onSubmit={onAnalyze} />

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {preview && (
        <MappingTable
          merged={merged}
          confirming={confirming}
          onFieldChange={(patch) => setEdits({ ...edits, ...patch })}
          onCancel={() => {
            setPreview(null);
            setEdits({});
          }}
          onConfirm={onConfirm}
        />
      )}

      <RecentImports recentImports={recentImports} recentError={recentError} />
    </div>
  );
}
