'use client'

import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'

/**
 * Visual primitive shared by `InsigniaList`, `BadgeStrip`, the public catalog
 * grid, and the catalog detail hero.
 *
 * Design system — "engineer aesthetic":
 *   - Hexagonal frame (clip-path) — the signature shape of dev achievements
 *     (think GitHub badges, Stack Overflow ribbons, CI status chips).
 *   - Dark slate body (`#0b1220` / `slate-950`) with subtle inner sheen.
 *   - Category-coded glow + thin accent ring.
 *   - Mono-style tier label below the hex (WORLD, PHD, L4, …) when relevant.
 *   - Default icon set is a curated SVG per category — verification gets a
 *     check, study a graduation cap, sports a trophy, recognition a sparkle,
 *     pioneer a star, authentication a shield, fallback a stylized `</>`.
 *
 * Tasteful, precise, and instantly readable as "this user has shipped".
 */

type Category = string
type Tier = string | null
type Size = 'insignia' | 'badge' | 'catalog' | 'detail'

interface Palette {
  /** Outer accent ring (CSS color) — also used for the soft glow. */
  accent: string
  /** Icon color on the dark slate body. */
  iconColor: string
}

// Tailwind class tokens. Picked so we have one foreground color per category
// that pops nicely against `bg-slate-950`. Hex colors mirrored for the inline
// style (the glow and ring need a real CSS color, not a class).
const PALETTES: Record<string, Palette & { rgb: string }> = {
  verification:   { accent: 'border-emerald-400',  iconColor: 'text-emerald-400',  rgb: '52, 211, 153' },  // emerald-400
  study:          { accent: 'border-sky-400',      iconColor: 'text-sky-300',      rgb: '56, 189, 248' },  // sky-400
  sports:         { accent: 'border-rose-400',     iconColor: 'text-rose-300',     rgb: '251, 113, 133' }, // rose-400
  recognition:    { accent: 'border-amber-400',    iconColor: 'text-amber-300',    rgb: '251, 191, 36' },  // amber-400
  pioneer:        { accent: 'border-amber-400',    iconColor: 'text-amber-300',    rgb: '251, 191, 36' },
  authentication: { accent: 'border-violet-400',   iconColor: 'text-violet-300',   rgb: '167, 139, 250' }, // violet-400
  other:          { accent: 'border-slate-400',    iconColor: 'text-slate-300',    rgb: '148, 163, 184' }, // slate-400
}

function paletteFor(category: Category) {
  return PALETTES[category] ?? PALETTES.other
}

/** Mono-style code shown in the tier slot. World/PhD get the "S-tier" feel. */
const TIER_CODE: Record<string, string> = {
  world: 'S',         mundial: 'S',
  regional: 'A',
  national: 'B',      nacional: 'B',
  local: 'C',
  phd: 'PHD',         doctorado: 'PHD',
  msc: 'MSC',         maestria: 'MSC',
  bsc: 'BSC',         licenciatura: 'BSC',
}

function tierCode(tier: Tier): string | null {
  if (!tier) return null
  const key = tier.toLowerCase().trim()
  return TIER_CODE[key] ?? tier.toUpperCase().slice(0, 4)
}

const SIZE_TOKENS: Record<
  Size,
  {
    box: string         // overall span (hex + label)
    hexSize: string     // hex dimensions (square, gets clip-pathed)
    borderWidth: string // accent ring thickness
    iconSize: string    // SVG dimensions
    labelText: string   // tier-code typography
    showLabel: boolean
  }
> = {
  insignia: { box: 'h-7 w-7 lg:h-8 lg:w-8',   hexSize: 'h-7 w-7 lg:h-8 lg:w-8',   borderWidth: 'border-[1.5px]', iconSize: 'h-3.5 w-3.5 lg:h-4 lg:w-4', labelText: 'text-[8px]',  showLabel: false },
  badge:    { box: 'h-14 w-12 sm:h-16 sm:w-14', hexSize: 'h-12 w-12 sm:h-14 sm:w-14', borderWidth: 'border-2',     iconSize: 'h-6 w-6 sm:h-7 sm:w-7',    labelText: 'text-[9px]',  showLabel: true },
  catalog:  { box: 'h-16 w-14 sm:h-18 sm:w-16', hexSize: 'h-14 w-14 sm:h-16 sm:w-16', borderWidth: 'border-2',     iconSize: 'h-7 w-7 sm:h-8 sm:w-8',    labelText: 'text-[9px]',  showLabel: true },
  detail:   { box: 'h-28 w-24',                hexSize: 'h-24 w-24',                borderWidth: 'border-[3px]', iconSize: 'h-12 w-12',                 labelText: 'text-[11px]', showLabel: true },
}

const HEX_CLIP = 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)'

interface Props {
  category: Category
  tier?: Tier
  iconUrl?: string | null
  /** Catalog slug — used to pick the SVG for seeded system badges. */
  slug?: string
  alt?: string
  size?: Size
  children?: ReactNode
  /** Tiny override badge (e.g. pioneer "#42"). */
  cornerBadge?: string | null
  className?: string
  style?: CSSProperties
}

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
  const code = tierCode(tier)

  return (
    <span
      className={`relative inline-flex shrink-0 flex-col items-center justify-start ${tokens.box} ${className}`}
      style={style}
    >
      {/* Soft category glow behind the hex */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 blur-md"
        style={{
          width: '85%',
          height: size === 'insignia' ? '85%' : '70%',
          background: `radial-gradient(circle, rgba(${palette.rgb}, 0.55) 0%, rgba(${palette.rgb}, 0) 70%)`,
        }}
      />

      {/* Hex frame — accent-colored ring */}
      <span
        className={`relative ${tokens.hexSize} ${tokens.borderWidth} ${palette.accent} bg-slate-950`}
        style={{ clipPath: HEX_CLIP }}
      >
        {/* Inner hex sheen — subtle gradient + grid texture for the dev feel */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(155deg, rgba(${palette.rgb}, 0.18) 0%, rgba(255,255,255,0) 45%), repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 4px)`,
          }}
        />

        {/* Center icon */}
        <span className="absolute inset-0 flex items-center justify-center">
          {children ? (
            <span className={`${palette.iconColor} ${tokens.iconSize}`}>{children}</span>
          ) : iconUrl ? (
            <Image
              src={iconUrl}
              alt={alt}
              width={64}
              height={64}
              unoptimized
              className={`${tokens.iconSize} object-contain`}
            />
          ) : (
            <DefaultIcon
              slug={slug}
              category={category}
              className={`${palette.iconColor} ${tokens.iconSize}`}
            />
          )}
        </span>
      </span>

      {/* Mono tier code beneath the hex */}
      {tokens.showLabel && code && (
        <span
          className={`mt-1 inline-flex items-center rounded-sm border ${palette.accent} bg-slate-950 px-1 py-px font-mono font-bold uppercase leading-none tracking-wider ${palette.iconColor} ${tokens.labelText}`}
        >
          {code}
        </span>
      )}

      {/* Corner pill (Pioneer #N) — only used by the insignia row */}
      {cornerBadge && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 rounded-full bg-slate-950 px-1 font-mono text-[8px] font-bold leading-tight text-amber-300 shadow ring-1 ring-amber-400/70"
        >
          {cornerBadge}
        </span>
      )}
    </span>
  )
}

/** Default icon set — picked by slug (seeded badges) or category. */
function DefaultIcon({
  slug,
  category,
  className,
}: {
  slug?: string
  category: Category
  className: string
}) {
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
  // Engineer-y fallback: stylized angle brackets `</>`
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5-4 4.5 4 4.5M17.25 7.5l4 4.5-4 4.5M14 4 10 20" />
    </svg>
  )
}
