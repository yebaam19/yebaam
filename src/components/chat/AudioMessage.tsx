'use client';

import { useEffect, useState } from 'react';
import type { MessageMedia } from '@/features/chat/types';

function fmt(s?: number): string {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const ss = Math.round(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

/**
 * Plays a chat voice note. The R2 key is exchanged for a short-lived,
 * membership-checked presigned URL via the conversation's audio route, then
 * rendered with the native audio controls.
 */
export default function AudioMessage({
  media,
  conversationId,
}: {
  media: MessageMedia;
  conversationId?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!media.r2_key || !conversationId) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/audio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ r2_key: media.r2_key }),
        });
        const data = (await res.json().catch(() => null)) as { url?: string } | null;
        if (cancelled) return;
        if (res.ok && data?.url) setUrl(data.url);
        else setFailed(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [media.r2_key, conversationId]);

  if (failed) {
    return <div className="px-3 py-2 text-xs opacity-70">🎤 {fmt(media.duration) || 'audio'}</div>;
  }
  if (!url) {
    return <div className="px-3 py-2 text-xs opacity-70">🎤 …</div>;
  }
  return (
    <div className="flex items-center gap-1 px-2 py-1.5">
      <audio controls preload="none" src={url} className="h-9 w-56 max-w-full" />
      {media.duration ? <span className="text-[10px] opacity-70">{fmt(media.duration)}</span> : null}
    </div>
  );
}
