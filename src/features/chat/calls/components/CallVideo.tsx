'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Binds a MediaStream to a <video>. `muted` is required for the LOCAL preview
 * (and lets autoplay proceed); the remote element stays unmuted so its audio
 * plays even in a voice call where the element is visually hidden.
 */
export default function CallVideo({
  stream,
  muted = false,
  mirror = false,
  className,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  mirror?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.srcObject !== stream) el.srcObject = stream;
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={cn(className, mirror && 'scale-x-[-1]')}
    />
  );
}
