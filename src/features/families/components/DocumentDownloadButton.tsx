'use client';

import { useState, useTransition } from 'react';
import { getDocumentSignedUrl } from '../actions/families.actions';

export function DocumentDownloadButton({ documentId }: { documentId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await getDocumentSignedUrl(documentId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Open in a new tab; the URL is short-lived (60s).
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {pending ? 'Firmando URL…' : 'Descargar'}
      </button>
      {error && <p className="text-[10px] text-rose-600">{error}</p>}
    </div>
  );
}
