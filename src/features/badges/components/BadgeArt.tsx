'use client'

import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'

/**
 * Visual primitive shared by `InsigniaList`, `BadgeStrip`, and the public
 * catalog. One source of truth for the look: per-category gradient palettes,
 * tier-driven metallic ring colors, a glossy top-left highlight, drop shadow,
 * and a center icon (uploaded Cloudflare image, custom SVG for the seeded
 * system badges, or category-default heroicon).
 *
 * Design intent: feel like a polished gym/medal badge (think Pokemon league
 * badges rendered in the Yebaam visual language) — bold, glossy, instantly
 * recognizable per category, with subtle prestige cues for tier.
 */

type Category = string
type Tier = string | null
type Size = 'insignia' | 'badge' | 'catalog' | 'detail'

interface Palette {
  /** Outer metallic ring gradient (the bezel). */
  ring: string
  /** Main body gradient (the gem face). */
  body: string
  /** Default icon color when uploaded icon is absent. */
  iconColor: string
  /** Drop-shadow tint that gives the badge its lit-from-above feel. */
  shadow: string
}

const PALETTES: Record<string, Palette> = {
  verification: {
    ring: 'from-emerald-200 via-emerald-100 to-emerald-300',
    body: 'from-emerald-500 via-emerald-400 to-emerald-600',
    iconColor: 'text-white',
    shadow: 'shadow-[0_4px_16px_-4px_rgba(16,185,129,0.55)]',
  },
  study: {
    ring: 'from-indigo-200 via-blue-100 to-indigo-300',
    body: 'from-indigo-500 via-blue-500 to-indigo-700',
    iconColor: 'text-white',
    shadow: 'shadow-[0_4px_16px_-4px_rgba(79,70,229,0.55)]',
  },
  sports: {
    ring: 'from-red-200 via-orange-100 to-red-300',
    body: 'from-red-500 via-orange-500 to-rose-600',
    iconColor: 'text-white',
    shadow: 'shadow-[0_4px_16px_-4px_rgba(239,68,68,0.55)]',
  },
  recognition: {
    ring: 'from-amber-200 via-yellow-100 to-amber-300',
    body: 'from-amber-400 via-yellow-500 to-amber-600',
    iconColor: 'text-amber-950',
    shadow: 'shadow-[0_4px_16px_-4px_rgba(245,158,11,0.55)]',
  },
  pioneer: {
    ring: 'from-amber-300 via-yellow-200 to-orange-400',
    body: 'from-amber-400 via-yellow-500 to-orange-500',
    iconColor: 'text-amber-950',
    shadow: 'shadow-[0_4px_16px_-4px_rgba(251,146,60,0.6)]',
  },
  authentication: {
    ring: 'from-violet-200 via-fuchsia-100 to-violet-300',
    body: 'from-violet-500 via-fuchsia-500 to-violet-700',
    iconColor: 'text-white',
    shadow: 'shadow-[0_4px_16px_-4px_rgba(139,92,246,0.55)]',
  },
  other: {
    ring: 'from-slate-200 via-zinc-100 to-slate-300',
    body: 'from-slate-500 via-zinc-500 to-slate-700',
    iconColor: 'text-white',
    shadow: 'shadow-[0_4px_16px_-4px_rgba(100,116,139,0.5)]',
  },
}

function paletteFor(category: Category): Palette {
  return PALETTES[category] ?? PALETTES.other
}

/** Tier → outer ring accent. Higher tiers earn richer metals. */
const TIER_RING: Record<string, string> = {
  // Sports
  world: 'ring-amber-300/80',
  mundial: 'ring-amber-300/80',
  regional: 'ring-zinc-300/80',
  national: 'ring-amber-700/70',
  nacional: 'ring-amber-700/70',
  local: 'ring-zinc-500/60',
  // Study
  phd: 'ring-amber-300/80',
  doctorado: 'ring-amber-300/80',
  msc: 'ring-zinc-300/80',
  maestria: 'ring-zinc-300/80',
  bsc: 'ring-amber-700/70',
  licenciatura: 'ring-amber-700/70',
}

function tierRing(tier: Tier): string {
  if (!tier) return 'ring-white/70 dark:ring-gray-800/70'
  const key = tier.toLowerCase().trim()
  return TIER_RING[key] ?? 'ring-white/70 dark:ring-gray-800/70'
}

const SIZE_TOKENS: Record<Size, {
  outer: string
  inner: string
  iconSize: string
  ringWidth: string
  highlight: string
}> = {
  // Inline next to the display name
  insignia: {
    outer: 'h-7 w-7 lg:h-8 lg:w-8',
    inner: 'h-[22px] w-[22px] lg:h-[26px] lg:w-[26px]',
    iconSize: 'h-3.5 w-3.5 lg:h-4 lg:w-4',
    ringWidth: 'ring-2',
    highlight: 'after:h-1/2',
  },
  // In the strip below the cover photo
  badge: {
    outer: 'h-12 w-12 sm:h-14 sm:w-14',
    inner: 'h-[38px] w-[38px] sm:h-[46px] sm:w-[46px]',
    iconSize: 'h-6 w-6 sm:h-7 sm:w-7',
    ringWidth: 'ring-2',
    highlight: 'after:h-2/5',
  },
  // Catalog grid card
  catalog: {
    outer: 'h-14 w-14 sm:h-16 sm:w-16',
    inner: 'h-[46px] w-[46px] sm:h-[54px] sm:w-[54px]',
    iconSize: 'h-7 w-7 sm:h-8 sm:w-8',
    ringWidth: 'ring-2',
    highlight: 'after:h-2/5',
  },
  // Catalog detail hero
  detail: {
    outer: 'h-24 w-24',
    inner: 'h-[80px] w-[80px]',
    iconSize: 'h-12 w-12',
    ringWidth: 'ring-4',
    highlight: 'after:h-2/5',
  },
}

interface Props {
  category: Category
  tier?: Tier
  iconUrl?: string | null
  /** Catalog slug — used to pick the SVG for seeded system badges. */
  slug?: string
  /** Alt text for accessibility */
  alt?: string
  size?: Size
  /** Optional override for the inner SVG (lets callers force a specific icon). */
  children?: ReactNode
  /** Tiny extra glyph above the badge — e.g. a tiny pioneer number. */
  cornerBadge?: string | null
  className?: string
  style?: CSSProperties
}

/**
 * Polished circular badge.
 *
 * Structure:
 *   .outer       ← bezel: metallic gradient ring + tier accent
 *     .inner     ← gem face: category gradient
 *       icon     ← Cloudflare image OR category SVG
 *       .after   ← top-half soft highlight (glossy effect)
 *   .cornerBadge ← optional tiny pill (e.g. "#42")
 */
export function BadgeArt({
  category,
  tier = null,
  iconUrl = null,
  slug,
  alt = '',
  size = 'insignia',
  children,
  cornerBadge,
  className = '',
  style,
}: Props) {
  const palette = paletteFor(category)
  const tokens = SIZE_TOKENS[size]
  const ringAccent = tierRing(tier)

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={style}
    >
      {/* Outer bezel — metallic ring with tier accent */}
      <span
        className={`${tokens.outer} ${tokens.ringWidth} ${ringAccent} ${palette.shadow}
          inline-flex items-center justify-center rounded-full
          bg-gradient-to-br ${palette.ring}`}
      >
        {/* Inner gem — colored body + glossy highlight via ::after */}
        <span
          className={`${tokens.inner} relative inline-flex items-center justify-center overflow-hidden rounded-full
            bg-gradient-to-br ${palette.body}
            after:absolute after:inset-x-0 after:top-0 ${tokens.highlight}
            after:rounded-t-full after:bg-gradient-to-b after:from-white/35 after:to-transparent after:content-['']`}
        >
          {children ? (
            <span className={`${palette.iconColor} relative z-10 ${tokens.iconSize}`}>{children}</span>
          ) : iconUrl ? (
            <Image
              src={iconUrl}
              alt={alt}
              width={64}
              height={64}
              unoptimized
              className={`${tokens.inner} relative z-10 object-cover`}
            />
          ) : (
            <DefaultIcon
              slug={slug}
              category={category}
              className={`${palette.iconColor} relative z-10 ${tokens.iconSize}`}
            />
          )}
        </span>
      </span>

      {cornerBadge && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 rounded-full bg-white px-1 text-[9px] font-extrabold leading-tight text-amber-900 shadow-sm ring-1 ring-amber-300/70 dark:bg-gray-900 dark:text-amber-200"
        >
          {cornerBadge}
        </span>
      )}
    </span>
  )
}

/**
 * Default icon set, picked by slug (for seeded system badges) or category.
 * Inline SVGs so we don't pay a per-badge bundle hit on heroicons imports.
 */
function DefaultIcon({
  slug,
  category,
  className,
}: {
  slug?: string
  category: Category
  className: string
}) {
  // Seeded system badges get their canonical pictogram.
  if (slug === 'verificado' || category === 'verification') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.005l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.795-6.889a1 1 0 0 1 1.415-.006Z"
          clipRule="evenodd"
        />
      </svg>
    )
  }
  if (slug === 'pionero' || category === 'pioneer') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 2.75 14.39 8 20 8.81l-4 3.92.94 5.49L12 15.77l-4.94 2.45L8 12.73l-4-3.92L9.61 8 12 2.75Z" />
      </svg>
    )
  }
  if (category === 'study') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    )
  }
  if (category === 'sports') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
      </svg>
    )
  }
  if (category === 'recognition') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
      </svg>
    )
  }
  if (category === 'authentication') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
          clipRule="evenodd"
        />
      </svg>
    )
  }
  // Fallback: small generic spark
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .32-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  )
}
