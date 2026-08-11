'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { UMBRAL_PATH, UMBRAL_SHARE_COPIED, UMBRAL_SHARE_CTA } from '../constants';

/**
 * "Muy importante que se pueda enviar el link" (clave-1.pdf). Native share
 * sheet where available (mobile), clipboard copy elsewhere.
 */
export function ShareLink() {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function handleShare() {
    const url = `${window.location.origin}${UMBRAL_PATH}`;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ url });
        return;
      } catch (err) {
        // User dismissed the sheet — respect the cancel, don't copy anyway.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // Genuine share failure — fall through to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked — nothing sensible to do silently.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="group inline-flex items-center gap-3 text-[11px] tracking-[0.35em] text-neutral-500 uppercase transition-colors hover:text-emerald-200"
    >
      <Send className="h-3.5 w-3.5 opacity-60 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      {copied ? UMBRAL_SHARE_COPIED : UMBRAL_SHARE_CTA}
    </button>
  );
}
