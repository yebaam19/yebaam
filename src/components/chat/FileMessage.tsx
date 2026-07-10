'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, DocumentTextIcon } from '@/components/icons/heroicons-shim';
import type { MessageMedia } from '@/features/chat/types';
import { formatBytes } from '@/lib/upload-limits';

/**
 * Download card for a chat document attachment. The R2 key is exchanged for a
 * short-lived, membership-checked presigned URL via the conversation's file
 * route (which sets Content-Disposition to the original filename), then the
 * download is triggered with a transient anchor.
 */
export default function FileMessage({
  media,
  conversationId,
}: {
  media: MessageMedia;
  conversationId?: string;
}) {
  const t = useTranslations('chat.file');
  const [busy, setBusy] = useState(false);

  const name = media.filename?.trim() || t('fallbackName');

  const handleDownload = async () => {
    if (!media.r2_key || !conversationId || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ r2_key: media.r2_key, filename: media.filename }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string } | null;
      if (!res.ok || !data?.url) {
        toast.error(t('downloadFailed'));
        return;
      }
      const a = document.createElement('a');
      a.href = data.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      toast.error(t('downloadFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={busy}
      title={t('download')}
      className="flex w-full max-w-full items-center gap-2 px-3 py-2 text-left transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/10 dark:bg-white/15">
        <DocumentTextIcon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        {typeof media.size === 'number' && media.size > 0 && (
          <span className="block text-xs opacity-70">{formatBytes(media.size)}</span>
        )}
      </span>
      <ArrowDownTrayIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
    </button>
  );
}
