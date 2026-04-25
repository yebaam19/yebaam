'use client'

import type { ComponentType } from 'react'
import { HighlightedSuggestions } from './friends/HighlightedSuggestions'

/**
 * Right-sidebar rail registry.
 *
 * The default rail (Invite, Portal, Trending) renders globally on every
 * route — see `DefaultRail` in `RightSidebar.tsx`. Each entry here lists
 * extra blocks that should appear ABOVE the default rail on a specific
 * route.
 *
 * Add a new route by appending an entry to `RAIL_VARIANTS`. Pages must NOT
 * import the rail from inside their own tree.
 */

export type RailBlock = ComponentType

export interface RailVariant {
  /** Match strategy. `'exact'` (default) or `'prefix'`. */
  match?: 'exact' | 'prefix'
  /** Pathname to match against `usePathname()`. */
  pathname: string
  /** Extra rail blocks rendered ABOVE the default rail. */
  blocks: RailBlock[]
}

export const RAIL_VARIANTS: RailVariant[] = [
  {
    pathname: '/feed/friends',
    blocks: [HighlightedSuggestions],
  },
]

/**
 * Resolve a pathname to its extra rail blocks. Returns an empty array when
 * no variant matches (the default rail is still rendered).
 */
export function resolveRailExtras(pathname: string | null): RailBlock[] {
  if (!pathname) return []

  for (const variant of RAIL_VARIANTS) {
    const strategy = variant.match ?? 'exact'
    if (strategy === 'exact' && pathname === variant.pathname) return variant.blocks
    if (strategy === 'prefix' && pathname.startsWith(variant.pathname)) return variant.blocks
  }

  return []
}
