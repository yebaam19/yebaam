'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { coverTransformStyle } from '../../utils/coverTransform';

interface CoverRepositionEditorProps {
  src: string;
  /** 0..100 */
  offsetX: number;
  /** 0..100 */
  offsetY: number;
  /** 100..400 (integer percent) */
  zoom: number;
  onChange: (next: { offsetX: number; offsetY: number; zoom: number }) => void;
  onReset?: () => void;
  className?: string;
  alt?: string;
}

const ZOOM_MIN = 100;
const ZOOM_MAX = 400;
const ZOOM_STEP = 5;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

interface Pointer {
  id: number;
  x: number;
  y: number;
}

/**
 * WhatsApp-style cover repositioner. Image lives inside a fixed-aspect frame.
 * - Single-pointer drag: pans the image; offsets clamp so the image always
 *   covers the frame (no empty edges).
 * - Two-finger pinch: zooms in/out around the gesture's centroid.
 * - Wheel: zooms in/out on desktop (Ctrl+wheel = native browser zoom is bypassed).
 * - +/- buttons & slider: explicit zoom controls.
 * - Arrow keys: nudge offsets when the editor has focus.
 */
export default function CoverRepositionEditor({
  src,
  offsetX,
  offsetY,
  zoom,
  onChange,
  onReset,
  className,
  alt = 'Cover',
}: CoverRepositionEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef<Map<number, Pointer>>(new Map());
  const lastPanRef = useRef<{
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const lastPinchRef = useRef<{
    startDistance: number;
    startZoom: number;
  } | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const commit = useCallback(
    (partial: { offsetX?: number; offsetY?: number; zoom?: number }) => {
      const nextZoom = clamp(partial.zoom ?? zoom, ZOOM_MIN, ZOOM_MAX);
      const nextX = clamp(partial.offsetX ?? offsetX, 0, 100);
      const nextY = clamp(partial.offsetY ?? offsetY, 0, 100);
      onChange({ offsetX: nextX, offsetY: nextY, zoom: nextZoom });
    },
    [offsetX, offsetY, zoom, onChange],
  );

  const distance = (a: Pointer, b: Pointer) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
      });
      const pts = Array.from(pointersRef.current.values());
      if (pts.length === 1) {
        lastPanRef.current = {
          startX: pts[0].x,
          startY: pts[0].y,
          startOffsetX: offsetX,
          startOffsetY: offsetY,
        };
        lastPinchRef.current = null;
      } else if (pts.length === 2) {
        lastPanRef.current = null;
        lastPinchRef.current = {
          startDistance: distance(pts[0], pts[1]),
          startZoom: zoom,
        };
      }
      setIsInteracting(true);
    },
    [offsetX, offsetY, zoom],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el || !pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
      });

      const pts = Array.from(pointersRef.current.values());
      const rect = el.getBoundingClientRect();

      if (pts.length === 2 && lastPinchRef.current) {
        const newDistance = distance(pts[0], pts[1]);
        const ratio = newDistance / lastPinchRef.current.startDistance;
        commit({ zoom: lastPinchRef.current.startZoom * ratio });
        return;
      }

      if (pts.length === 1 && lastPanRef.current) {
        const z = zoom / 100;
        const overflowFactor = Math.max(z - 1, 0.001);
        // Cursor delta in pixels → image-overflow-percent (0..100 spans the
        // full pannable range). With zoom 1.0 there's no overflow, so panning
        // is a no-op (we keep the slider in charge).
        const dxPx = pts[0].x - lastPanRef.current.startX;
        const dyPx = pts[0].y - lastPanRef.current.startY;
        const dxPct = (dxPx / (rect.width * overflowFactor)) * 100;
        const dyPct = (dyPx / (rect.height * overflowFactor)) * 100;
        commit({
          // Drag right → reveal more of the LEFT of the image → offset goes DOWN.
          offsetX: lastPanRef.current.startOffsetX - dxPct,
          offsetY: lastPanRef.current.startOffsetY - dyPct,
        });
      }
    },
    [zoom, commit],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (el && el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
      pointersRef.current.delete(e.pointerId);
      const remaining = Array.from(pointersRef.current.values());
      if (remaining.length === 1) {
        // Transitioning from pinch back to pan — re-anchor the pan ref.
        lastPanRef.current = {
          startX: remaining[0].x,
          startY: remaining[0].y,
          startOffsetX: offsetX,
          startOffsetY: offsetY,
        };
        lastPinchRef.current = null;
      } else if (remaining.length === 0) {
        lastPanRef.current = null;
        lastPinchRef.current = null;
        setIsInteracting(false);
      }
    },
    [offsetX, offsetY],
  );

  // Native wheel listener so we can preventDefault and zoom instead of
  // scrolling the dialog.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (event: globalThis.WheelEvent) => {
      if (event.deltaY === 0) return;
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      const stepSize = event.shiftKey ? 25 : 10;
      commit({ zoom: zoom + direction * stepSize });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom, commit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? 10 : 2;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          commit({ offsetY: offsetY - step });
          break;
        case 'ArrowDown':
          e.preventDefault();
          commit({ offsetY: offsetY + step });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          commit({ offsetX: offsetX - step });
          break;
        case 'ArrowRight':
          e.preventDefault();
          commit({ offsetX: offsetX + step });
          break;
        case '+':
        case '=':
          e.preventDefault();
          commit({ zoom: zoom + ZOOM_STEP });
          break;
        case '-':
        case '_':
          e.preventDefault();
          commit({ zoom: zoom - ZOOM_STEP });
          break;
        default:
          break;
      }
    },
    [offsetX, offsetY, zoom, commit],
  );

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        tabIndex={0}
        role="application"
        aria-label="Reposicionar portada — arrastra, pellizca para hacer zoom, o usa las flechas"
        className={`relative h-48 w-full overflow-hidden rounded-xl bg-gray-900 select-none focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
          isInteracting ? 'cursor-grabbing' : 'cursor-grab'
        } touch-none ${className ?? ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover pointer-events-none"
          style={coverTransformStyle({ offsetX, offsetY, zoom })}
          sizes="(max-width: 1024px) 100vw, 600px"
          unoptimized
          priority
        />
        {/* Crop frame guides */}
        <div className="pointer-events-none absolute inset-0 ring-2 ring-white/30 ring-inset rounded-xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 to-transparent p-2 text-center text-xs font-medium text-white">
          Arrastra para mover · pellizca o usa la rueda para hacer zoom
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => commit({ zoom: zoom - 10 })}
          disabled={zoom <= ZOOM_MIN}
          className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          aria-label="Alejar"
        >
          −
        </button>
        <input
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={ZOOM_STEP}
          value={zoom}
          onChange={(e) => commit({ zoom: Number(e.target.value) })}
          className="flex-1 accent-emerald-500"
          aria-label="Zoom"
        />
        <button
          type="button"
          onClick={() => commit({ zoom: zoom + 10 })}
          disabled={zoom >= ZOOM_MAX}
          className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          aria-label="Acercar"
        >
          +
        </button>
        <span className="w-12 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
          {(zoom / 100).toFixed(1)}×
        </span>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Restablecer
          </button>
        )}
      </div>
    </div>
  );
}
