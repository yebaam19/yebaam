'use client'

import Link from 'next/link'
import type { Route } from 'next'
import type { ProfileBadge } from '@/features/badges/types/badges.types'
import { BadgeArt } from '@/features/badges/components/BadgeArt'

/**
 * Insignias rendered inline next to the display name in `UserProfile.tsx`.
 *
 * - Pioneer entries are filtered out — they are shown by `AvatarMedallion`
 *   directly on the avatar to match the reference design (single point of
 *   prestige cue per user, instead of two).
 * - All other accepted insignias render at `size="insignia"` via the shared
 *   `BadgeArt` primitive (engineer/hex aesthetic).
 */
export function InsigniaList({ items }: { items: ProfileBadge[] }) {
  const inline = (items ?? []).filter((b) => b.category !== 'pioneer')
  if (inline.length === 0) return null
  return (
    <>
      {inline.map((b) => (
        <InsigniaChip key={b.grantId} badge={b} />
      ))}
    </>
  )
}

/**
 * Returns the user's pioneer insignia (if any) so the avatar medallion can
 * render it without re-implementing the lookup at every call site.
 */
export function findPioneerInsignia(items: ProfileBadge[] | undefined): ProfileBadge | null {
  if (!items || items.length === 0) return null
  return items.find((b) => b.category === 'pioneer') ?? null
}

function InsigniaChip({ badge }: { badge: ProfileBadge }) {
  const href = `/insignias/${badge.slug}` as Route
  const title = badge.description ? `${badge.name}: ${badge.description}` : badge.name

  return (
    <Link
      href={href}
      title={title}
      aria-label={badge.label ?? badge.name}
      className="inline-flex items-center transition-transform duration-150 hover:-translate-y-0.5"
    >
      <BadgeArt
        size="insignia"
        category={badge.category}
        tier={badge.tier}
        slug={badge.slug}
        iconUrl={badge.iconUrl}
        alt={badge.name}
      />
    </Link>
  )
}
