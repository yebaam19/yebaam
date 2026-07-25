'use client';

import { useState } from 'react';
import { streamThumb } from '@/lib/media/urls';

interface StreamVideoProps {
  uid: string;
  /** autoplay=1 requires muted=1 on most browsers (see CF Stream docs). */
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  /** Preview poster offset in seconds. */
  posterTime?: number;
  /**
   * Poster width to request from Stream. Leave unset: Cloudflare's native frame
   * is already small, and forcing a width upscales portrait clips (see
   * `streamThumb`). Only set it for genuinely hero-sized slots.
   */
  posterWidth?: number;
  /** aspect ratio: e.g. "16 / 9" (CSS ratio value). Default: 16 / 9. */
  aspectRatio?: string;
  className?: string;
  title?: string;
}

/**
 * Cloudflare Stream embed, mounted lazily behind a poster facade.
 *
 * Each Stream iframe downloads Cloudflare's player bundle and measured ~2 s on
 * a real `/feed` load — with three videos in the timeline that was ~6 s of work
 * for players nobody had asked to watch. `loading="lazy"` does not help: it only
 * defers *offscreen* iframes, and timeline videos are on screen.
 *
 * So we render the Stream poster plus a play button, and only mount the iframe
 * once the viewer clicks. `autoplay` callers (lightbox, story viewer, mini
 * player) have already expressed intent, so they skip the facade entirely.
 */
export function StreamVideo({
  uid,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  posterTime,
  posterWidth,
  aspectRatio = '16 / 9',
  className,
  title = 'Video',
}: StreamVideoProps) {
  const [activated, setActivated] = useState(autoplay);

  if (!activated) {
    const poster = streamThumb(uid, {
      ...(posterWidth != null ? { width: posterWidth } : {}),
      ...(posterTime != null ? { time: posterTime } : {}),
    });

    return (
      <div className={className} style={{ aspectRatio, width: '100%' }}>
        <button
          type="button"
          onClick={() => setActivated(true)}
          aria-label={`Reproducir ${title}`}
          className="group relative flex h-full w-full items-center justify-center overflow-hidden bg-black"
        >
          <img
            src={poster}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            /* `contain`, not `cover`: the Stream player letterboxes a video whose
               aspect ratio differs from the slot (portrait clips in a 16/9 feed
               card are common), so cropping the poster would make the framing
               jump the moment the player mounts. */
            className="absolute inset-0 h-full w-full object-contain"
          />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-black/60 ring-1 ring-white/30 transition group-hover:bg-black/80">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-7 w-7 text-white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      </div>
    );
  }

  const params = new URLSearchParams();
  // A click IS the play intent, so the iframe we mount on demand autoplays.
  params.set('autoplay', 'true');
  if (muted) params.set('muted', 'true');
  if (loop) params.set('loop', 'true');
  if (!controls) params.set('controls', 'false');
  if (posterTime != null) {
    params.set('poster', encodeURIComponent(streamThumb(uid, { time: posterTime })));
  }
  const src = `https://iframe.videodelivery.net/${uid}?${params.toString()}`;

  return (
    <div className={className} style={{ aspectRatio, width: '100%' }}>
      <iframe
        src={src}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        title={title}
        style={{ border: 'none', width: '100%', height: '100%' }}
      />
    </div>
  );
}
