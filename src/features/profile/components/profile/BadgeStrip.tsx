'use client'

import Link from 'next/link'
import type { Route } from 'next'
import type { ProfileBadge } from '@/features/badges/types/badges.types'
import { BadgeArt } from '@/features/badges/components/BadgeArt'

/**
 * Horizontal strip of badges rendered immediately below the cover photo.
 * Each card is a "trophy plaque": polished BadgeArt + name + optional tier
 * stripe, with a subtle hover lift. Empty list collapses entirely.
 */
export function BadgeStrip({ badges }: { badges: ProfileBadge[] }) {
  if (!badges || badges.length === 0) return null
  return (
    <div className="mx-auto mt-3 max-w-5xl px-3 sm:px-6 lg:px-8">
      <ul className="flex flex-wrap items-stretch gap-3">
        {badges.map((b) => (
          <li key={b.grantId}>
            <BadgeCard badge={b} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function BadgeCard({ badge }: { badge: ProfileBadge }) {
  const tooltip = badge.description ? `${badge.name}: ${badge.description}` : badge.name
  const tierLabel = formatTier(badge.tier)

  return (
    <Link
      href={`/insignias/${badge.slug}` as Route}
      title={tooltip}
      aria-label={badge.name}
      className="group flex items-center gap-2.5 rounded-2xl border border-neutral-200/80 bg-white/90 px-2.5 py-1.5 shadow-sm backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:hover:border-primary-700"
    >
      <BadgeArt
        size="badge"
        category={badge.category}
        tier={badge.tier}
        slug={badge.slug}
        iconUrl={badge.iconUrl}
        alt={badge.name}
      />
      <span className="flex min-w-0 flex-col pr-1">
        <span className="max-w-[10rem] truncate text-xs font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
          {badge.label ?? badge.name}
        </span>
        {tierLabel && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {tierLabel}
          </span>
        )}
      </span>
    </Link>
  )
}

const TIER_LABEL: Record<string, string> = {
  world: 'Mundial',
  mundial: 'Mundial',
  regional: 'Regional',
  national: 'Nacional',
  nacional: 'Nacional',
  local: 'Local',
  phd: 'Doctorado',
  doctorado: 'Doctorado',
  msc: 'Maestría',
  maestria: 'Maestría',
  bsc: 'Licenciatura',
  licenciatura: 'Licenciatura',
}

function formatTier(tier: string | null): string | null {
  if (!tier) return null
  return TIER_LABEL[tier.toLowerCase().trim()] ?? tier
}
