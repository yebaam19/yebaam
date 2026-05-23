'use client'

import Link from 'next/link'
import type { Route } from 'next'
import type { ProfileBadge } from '@/features/badges/types/badges.types'
import { BadgeArt } from '@/features/badges/components/BadgeArt'

/**
 * Insignias rendered inline next to the display name in `UserProfile.tsx`.
 * Uses the shared `<BadgeArt/>` primitive at `size="insignia"` so the styling
 * stays consistent with the badge strip and the public catalog.
 *
 * - Verificado and Pionero (seeded `is_system=true`) keep their historical
 *   pictograms via the slug-based default-icon lookup inside BadgeArt.
 * - Pionero shows the user's number as a corner pill (extracted from
 *   `user_badges.reason`, e.g. "Pionero #42") — keeps the legacy UX.
 * - Generic insignias (Doctorado, etc.) get a category-driven gradient + icon.
 */
export function InsigniaList({ items }: { items: ProfileBadge[] }) {
  if (!items || items.length === 0) return null
  return (
    <>
      {items.map((b) => (
        <InsigniaChip key={b.grantId} badge={b} />
      ))}
    </>
  )
}

function InsigniaChip({ badge }: { badge: ProfileBadge }) {
  const href = `/insignias/${badge.slug}` as Route
  const title = badge.description ? `${badge.name}: ${badge.description}` : badge.name
  const pioneerNumber = extractPioneerNumber(badge.label)

  return (
    <Link
      href={href}
      title={title}
      aria-label={badge.label ?? badge.name}
      className="inline-flex items-center transition-transform duration-150 hover:-translate-y-0.5 hover:rotate-[-3deg]"
    >
      <BadgeArt
        size="insignia"
        category={badge.category}
        tier={badge.tier}
        slug={badge.slug}
        iconUrl={badge.iconUrl}
        alt={badge.name}
        cornerBadge={pioneerNumber ? `#${pioneerNumber}` : null}
      />
    </Link>
  )
}

function extractPioneerNumber(label: string | null): string | null {
  if (!label) return null
  const m = /^Pionero #(\d+)$/.exec(label)
  return m ? m[1] : null
}
