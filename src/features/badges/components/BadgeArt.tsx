'use client'

import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'
import { badgeTierCode } from '@/features/badges/lib/badgeTaxonomy'
import { BadgeDefaultIcon } from './BadgeDefaultIcon'

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
  engineering:    { accent: 'border-cyan-400',     iconColor: 'text-cyan-300',     rgb: '34, 211, 238' },  // cyan-400
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
function tierCode(tier: Tier): string | null {
  return badgeTierCode(tier)
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
            <BadgeDefaultIcon
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
