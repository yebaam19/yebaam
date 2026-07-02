import type { CSSProperties } from 'react';

/**
 * Shared emprendimientos constants — framework-agnostic (no 'server-only',
 * no 'use client') so both the server reads and the client islands
 * (toolbar chips, category picker) can import them.
 */

export const EMPRENDIMIENTO_CATEGORIES = [
  'comida',
  'ropa',
  'servicios',
  'tecnologia',
  'artesanias',
  'belleza',
  'hogar',
  'otro',
] as const;
export type EmprendimientoCategory = (typeof EMPRENDIMIENTO_CATEGORIES)[number];

export type EmprendimientoStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Visual identity per "tipo de venta" — the market-stall personality of the
 * feature. Emojis carry meaning for low-literacy users faster than any label,
 * and the per-category color makes the grid read like a feria popular.
 * Tailwind needs literal class strings, hence the explicit maps.
 */
export const EMPRENDIMIENTO_CATEGORY_EMOJI: Record<EmprendimientoCategory, string> = {
  comida: '🍲',
  ropa: '👕',
  servicios: '🛠️',
  tecnologia: '📱',
  artesanias: '🧺',
  belleza: '💇',
  hogar: '🏡',
  otro: '⭐',
};

/** Solid chip over the card/hero photo. */
export const EMPRENDIMIENTO_CATEGORY_CHIP: Record<EmprendimientoCategory, string> = {
  comida: 'bg-amber-500 text-white',
  ropa: 'bg-rose-500 text-white',
  servicios: 'bg-sky-600 text-white',
  tecnologia: 'bg-indigo-500 text-white',
  artesanias: 'bg-orange-600 text-white',
  belleza: 'bg-fuchsia-500 text-white',
  hogar: 'bg-teal-600 text-white',
  otro: 'bg-neutral-600 text-white',
};

/** Photo-less fallback gradient (card thumb + detail hero). */
export const EMPRENDIMIENTO_CATEGORY_GRADIENT: Record<EmprendimientoCategory, string> = {
  comida: 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500',
  ropa: 'bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-600',
  servicios: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600',
  tecnologia: 'bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600',
  artesanias: 'bg-gradient-to-br from-orange-400 via-red-400 to-rose-500',
  belleza: 'bg-gradient-to-br from-fuchsia-400 via-pink-500 to-rose-500',
  hogar: 'bg-gradient-to-br from-teal-400 via-cyan-500 to-sky-600',
  otro: 'bg-gradient-to-br from-neutral-400 via-neutral-500 to-neutral-600',
};

/** Market-awning diagonal stripes layered over the fallback gradients. */
export const AWNING_STRIPES: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.16) 14px, transparent 14px, transparent 28px)',
};
