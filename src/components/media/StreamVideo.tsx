'use client';

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
  /** aspect ratio: e.g. "16 / 9" (CSS ratio value). Default: 16 / 9. */
  aspectRatio?: string;
  className?: string;
  title?: string;
}

/**
 * Thin wrapper around Cloudflare Stream's embed iframe. Zero external deps —
 * we can migrate to `@cloudflare/stream-react` later if we need event callbacks.
 */
export function StreamVideo({
  uid,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  posterTime,
  aspectRatio = '16 / 9',
  className,
  title = 'Video',
}: StreamVideoProps) {
  const params = new URLSearchParams();
  if (autoplay) params.set('autoplay', 'true');
  if (muted) params.set('muted', 'true');
  if (loop) params.set('loop', 'true');
  if (!controls) params.set('controls', 'false');
  if (posterTime != null) {
    params.set(
      'poster',
      encodeURIComponent(streamThumb(uid, { time: posterTime })),
    );
  }
  const qs = params.toString();
  const src = `https://iframe.videodelivery.net/${uid}${qs ? `?${qs}` : ''}`;

  return (
    <div className={className} style={{ aspectRatio, width: '100%' }}>
      <iframe
        src={src}
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        title={title}
        style={{ border: 'none', width: '100%', height: '100%' }}
      />
    </div>
  );
}
