'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { DOCUMENT_ACCEPT } from '@/lib/upload-documents';
import { formatBytes, MAX_DOCUMENT_BYTES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from '@/lib/upload-limits';
import { libraryFileType, uploadLibraryItem, type LibraryUpload } from '../../utils/library-upload';
import type { AssetKind, LibraryAsset } from '../../types/communityLibrary.types';

export function LibraryUploadPanel({ communityId, kind, replacement, pdfOnly, onClose }: {
  communityId: string; kind: AssetKind; replacement?: LibraryAsset; pdfOnly: boolean; onClose: () => void;
}) {
  const t = useTranslations('communities.library');
  const [items, setItems] = useState<LibraryUpload[]>([]);
  const queue = useRef<LibraryUpload[]>([]);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const unfinished = items.some((item) => item.state !== 'saved');
  useEffect(() => {
    if (!unfinished) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [unfinished]);

  function patch(id: string, value: Partial<LibraryUpload>) {
    queue.current = queue.current.map((item) => item.id === id ? { ...item, ...value } : item);
    setItems(queue.current);
  }
  function choose(files: FileList | null) {
    if (!files || running.current) return;
    const selected = [...files];
    const valid = selected.every((file) => libraryFileType(file, kind) && (!pdfOnly || libraryFileType(file, kind) === 'application/pdf'));
    if (!valid || selected.length > (replacement ? 1 : 20)) { setError(t('invalidFiles')); return; }
    setError('');
    queue.current = selected.map((file) => ({ id: crypto.randomUUID(), file, contentType: libraryFileType(file, kind)!, progress: 0, state: 'queued' }));
    setItems(queue.current);
  }
  async function upload() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    for (const item of queue.current) {
      if (item.state === 'saved') continue;
      try { await uploadLibraryItem(communityId, kind, item, (value) => patch(item.id, value), replacement); }
      catch (cause) { patch(item.id, { state: 'error', error: cause instanceof Error ? cause.message : t('uploadError') }); }
    }
    running.current = false;
    setBusy(false);
  }
  function close() { onClose(); }
  const limit = kind === 'image' ? MAX_IMAGE_BYTES : kind === 'video' ? MAX_VIDEO_BYTES : MAX_DOCUMENT_BYTES;
  const accept = kind === 'image' ? 'image/jpeg,image/png,image/webp,image/gif,image/avif' : kind === 'video'
    ? 'video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska' : pdfOnly ? '.pdf,application/pdf' : DOCUMENT_ACCEPT;
  return <div className="space-y-4">
    <h3 className="break-words text-lg font-semibold">{replacement ? t('replaceTitle', { title: replacement.title }) : t('upload')}</h3>
    <p className="text-sm text-neutral-600 dark:text-neutral-300">{t(replacement ? 'replaceHint' : 'uploadHint', { size: formatBytes(limit) })}</p>
    {!items.length && <label className="block text-sm font-medium">{t('chooseFiles')}
      <input autoFocus type="file" accept={accept} multiple={!replacement} disabled={busy} onChange={(event) => choose(event.currentTarget.files)}
        className="mt-2 block w-full min-w-0 rounded-lg border border-neutral-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-neutral-800 focus-visible:outline-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300 dark:border-neutral-600 dark:file:bg-neutral-700 dark:file:text-white" />
    </label>}
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
      {items.map((item) => <li key={item.id} className="space-y-2 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm"><span className="min-w-0 break-all font-medium">{item.file.name}</span>
          <span role="status" className="text-neutral-600 dark:text-neutral-300">{t(`uploadStates.${item.state}`)}</span></div>
        {item.state === 'uploading' && <progress aria-label={t('progress', { title: item.file.name })} max={100} value={item.progress} className="h-1.5 w-full accent-primary-800" />}
        {item.error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{item.error}</p>}
      </li>)}
    </ul>
    {confirmClose ? <div className="space-y-3"><p className="text-sm">{t('discardQueue')}</p><div className="flex flex-wrap gap-2">
      <Button color="red" onClick={close}>{t('discard')}</Button><Button outline onClick={() => setConfirmClose(false)}>{t('keepUploading')}</Button>
    </div></div> : <div className="flex flex-wrap gap-2">
      {unfinished && <Button color="brand" disabled={busy} onClick={upload}>{t(busy ? 'uploading' : items.some((item) => item.state === 'error') ? 'retry' : 'upload')}</Button>}
      <Button outline disabled={busy} onClick={() => unfinished ? setConfirmClose(true) : close()}>{t(items.length && !unfinished ? 'done' : 'cancel')}</Button>
    </div>}
  </div>;
}
