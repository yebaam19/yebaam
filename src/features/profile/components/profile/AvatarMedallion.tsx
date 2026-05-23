'use client'

import type { ProfileBadge } from '@/features/badges/types/badges.types'

/**
 * Small overlay pill positioned at the avatar's bottom-left.
 *
 * Visual identity matches `BadgeArt` (dark slate body, accent ring, mono font)
 * but inline rather than hexagonal — the pill shape works better at the size
 * required to overlap a circular avatar without dominating it.
 *
 * Renders the Pionero insignia number as the primary label (e.g. `#1 ★`).
 * Falls back to the badge name when no number is embedded.
 */
export function AvatarMedallion({ badge }: { badge: ProfileBadge | null }) {
  if (!badge) return null
  const label = formatLabel(badge)

  return (
    <span
      aria-hidden="false"
      title={badge.description ? `${badge.name}: ${badge.description}` : badge.name}
      className="absolute bottom-1 left-0 inline-flex items-center gap-1 rounded-full border border-emerald-400/80 bg-slate-950/95 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-emerald-300 shadow-lg ring-1 ring-emerald-400/40 backdrop-blur-sm lg:bottom-2 lg:left-1 lg:px-2 lg:text-[11px]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-3 w-3 lg:h-3.5 lg:w-3.5"
        aria-hidden="true"
      >
        <path d="M12 2.75 14.39 8 20 8.81l-4 3.92.94 5.49L12 15.77l-4.94 2.45L8 12.73l-4-3.92L9.61 8 12 2.75Z" />
      </svg>
      <span className="tracking-wide">{label}</span>
    </span>
  )
}

function formatLabel(badge: ProfileBadge): string {
  // Pionero #N is the canonical pioneer label coming from
  // user_badges.reason (set by the auto-sync trigger).
  if (badge.label) {
    const m = /^Pionero #(\d+)$/.exec(badge.label)
    if (m) return `#${m[1]}`
    return badge.label
  }
  return badge.name
}
