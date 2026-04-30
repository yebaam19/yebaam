'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
} from 'react';

interface CoverRepositionEditorProps {
  src: string;
  /** 0..100 */
  offsetX: number;
  /** 0..100 */
  offsetY: number;
  onChange: (offsetX: number, offsetY: number) => void;
  /** Optional fixed height for the preview (default mirrors public cover proportions). */
  className?: string;
  alt?: string;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Drag, wheel, or keyboard-arrow to reposition a cover image. Emits
 * `onChange(x, y)` with values 0..100 (object-position percentages).
 *
 * - Click + drag pulls the image; cursor delta is translated to a percentage
 *   move using the container's pixel size.
 * - Wheel scrolls Y by 2 percent per notch.
 * - Arrow keys nudge by 2 percent (10 with Shift) when the editor is focused.
 */
export default function CoverRepositionEditor({
  src,
  offsetX,
  offsetY,
  onChange,
  className,
  alt = 'Cover',
}: CoverRepositionEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startOffsetX: offsetX,
        startOffsetY: offsetY,
      };
      setIsDragging(true);
    },
    [offsetX, offsetY],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      const start = dragStartRef.current;
      if (!el || !start) return;

      const rect = el.getBoundingClientRect();
      // Inverse axis: dragging right reveals more of the left side, so
      // object-position-x should decrease as the cursor moves right.
      // We pick the natural feel ("the image follows the finger") so an
      // upward drag reveals more of the bottom (Y goes up).
      const dx = ((e.clientX - start.x) / rect.width) * 100;
      const dy = ((e.clientY - start.y) / rect.height) * 100;
      const nextX = clamp(start.startOffsetX - dx);
      const nextY = clamp(start.startOffsetY - dy);
      onChange(nextX, nextY);
    },
    [onChange],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (el && el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
      dragStartRef.current = null;
      setIsDragging(false);
    },
    [],
  );

  const handleWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      // Avoid hijacking page scroll outside the editor; only react when the
      // user explicitly hovers the preview.
      if (e.deltaY === 0) return;
      e.preventDefault();
      onChange(offsetX, clamp(offsetY + (e.deltaY > 0 ? 2 : -2)));
    },
    [offsetX, offsetY, onChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? 10 : 2;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onChange(offsetX, clamp(offsetY - step));
          break;
        case 'ArrowDown':
          e.preventDefault();
          onChange(offsetX, clamp(offsetY + step));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onChange(clamp(offsetX - step), offsetY);
          break;
        case 'ArrowRight':
          e.preventDefault();
          onChange(clamp(offsetX + step), offsetY);
          break;
        default:
          break;
      }
    },
    [offsetX, offsetY, onChange],
  );

  // Native wheel handler with `passive: false` so we can preventDefault.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheelNative = (event: globalThis.WheelEvent) => {
      if (event.deltaY === 0) return;
      event.preventDefault();
      onChange(offsetX, clamp(offsetY + (event.deltaY > 0 ? 2 : -2)));
    };
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, [offsetX, offsetY, onChange]);

  const objectPosition: CSSProperties = {
    objectPosition: `${offsetX}% ${offsetY}%`,
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="application"
      aria-label="Reposicionar portada — arrastra, usa la rueda o las flechas"
      className={`relative h-48 w-full overflow-hidden rounded-xl bg-gray-100 select-none focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-gray-700 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } ${className ?? ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover pointer-events-none"
        style={objectPosition}
        sizes="(max-width: 1024px) 100vw, 600px"
        unoptimized
        priority
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2 text-center text-xs font-medium text-white">
        Arrastra para reposicionar
      </div>
    </div>
  );
}
