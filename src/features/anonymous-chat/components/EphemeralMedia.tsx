'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AnonMediaPayload } from '../types';

/**
 * Renders an ephemeral image with the PDF's two media rules, best-effort on the
 * web:
 *  - **No download**: no save affordance, context-menu + drag disabled, the
 *    `<img>` is pointer-events-none. (Screenshots/devtools can't be prevented.)
 *  - **Vanishes after 5 min**: a countdown blanks the image; server-side, the
 *    signed URL's `exp` also expires, so it genuinely can't be re-fetched.
 *
 * The signed URL is minted per-client via the media-url route (the image was
 * uploaded with requireSignedURLs=true).
 */
export default function EphemeralMedia({ media }: { media: AnonMediaPayload }) {
  const t = useTranslations('chat.anonymous.media');
  const [url, setUrl] = useState<string | null>(null);
  const [expired, setExpired] = useState(() => Date.now() >= media.expiresAt);
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((media.expiresAt - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (expired || media.kind !== 'image') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/anon-chat/media-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cfId: media.cfId }),
        });
        const data = (await res.json().catch(() => null)) as { url?: string } | null;
        if (!cancelled && data?.url) setUrl(data.url);
      } catch {
        /* leave as loading; the countdown will eventually blank it */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [media.cfId, media.kind, expired]);

  useEffect(() => {
    if (expired) return;
    const tick = setInterval(() => {
      const rem = Math.max(0, Math.ceil((media.expiresAt - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) {
        setExpired(true);
        setUrl(null);
        clearInterval(tick);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [media.expiresAt, expired]);

  if (expired || media.kind !== 'image') {
    return (
      <div className="flex h-32 w-48 items-center justify-center rounded-lg bg-neutral-200 text-xs text-neutral-500 dark:bg-neutral-800">
        {t('expired')}
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-32 w-48 items-center justify-center rounded-lg bg-neutral-100 text-xs text-neutral-400 dark:bg-neutral-800">
        …
      </div>
    );
  }

  return (
    <div className="relative inline-block select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* eslint-disable-next-line @next/next/no-img-element -- ephemeral signed URL, must bypass next/image optimization + download affordances */}
      <img
        src={url}
        alt=""
        draggable={false}
        className="pointer-events-none max-h-60 max-w-[15rem] rounded-lg object-cover"
      />
      <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
        {t('expiresIn', { seconds: remaining })}
      </span>
    </div>
  );
}
