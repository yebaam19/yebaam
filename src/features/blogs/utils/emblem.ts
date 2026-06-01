/**
 * Follower-milestone emblem (PDF circle #3). The blog earns a colored emblem
 * once its follower count crosses a threshold:
 *   10k amarillo · 25k verde · 50k azul · 100k rojo · 250k bronce ·
 *   500k plateado · 1M dorado
 * Pure display logic — returns the highest tier reached, or null below 10k.
 */
export interface FollowerEmblem {
  tier: 'yellow' | 'green' | 'blue' | 'red' | 'bronze' | 'silver' | 'gold';
  /** Localized label, e.g. "Esmeralda · 1M". */
  label: string;
  /** Tailwind classes for the emblem circle (background + ring). */
  dotClass: string;
  min: number;
}

const TIERS: FollowerEmblem[] = [
  { tier: 'gold', min: 1_000_000, label: 'Oro · 1M seguidores', dotClass: 'bg-yellow-400 ring-yellow-200' },
  { tier: 'silver', min: 500_000, label: 'Plata · 500k seguidores', dotClass: 'bg-zinc-300 ring-zinc-100' },
  { tier: 'bronze', min: 250_000, label: 'Bronce · 250k seguidores', dotClass: 'bg-amber-600 ring-amber-300' },
  { tier: 'red', min: 100_000, label: 'Rojo · 100k seguidores', dotClass: 'bg-red-500 ring-red-200' },
  { tier: 'blue', min: 50_000, label: 'Azul · 50k seguidores', dotClass: 'bg-blue-500 ring-blue-200' },
  { tier: 'green', min: 25_000, label: 'Verde · 25k seguidores', dotClass: 'bg-green-500 ring-green-200' },
  { tier: 'yellow', min: 10_000, label: 'Amarillo · 10k seguidores', dotClass: 'bg-yellow-300 ring-yellow-100' },
];

/** Highest emblem tier reached for the given follower count, or null below 10k. */
export function followerEmblem(followersCount: number): FollowerEmblem | null {
  return TIERS.find((t) => followersCount >= t.min) ?? null;
}
