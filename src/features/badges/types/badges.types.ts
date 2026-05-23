/**
 * Client-safe types for the badges feature. Shared across profile rendering
 * (insignia list, badge strip), the public catalog, and the user request flow.
 *
 * The DB row shapes lives in the server modules (admin/badges.server.ts,
 * profile/badges.server.ts) — this file only exposes the view-model the UI
 * components consume.
 */

export type BadgeSlot = 'insignia' | 'badge'
export type BadgeVisibility = 'public' | 'private'
export type BadgeAcceptanceStatus = 'pending' | 'accepted' | 'declined'
export type BadgeRequestStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

/** Category controls the default visual treatment when the badge has no icon
 * (e.g. `verification` gets the emerald checkmark, `pioneer` the amber pill).
 * Free-form text in the DB; the UI maps a known set; unknown values fall back
 * to a generic chip. */
export type BadgeCategory =
  | 'verification'
  | 'study'
  | 'sports'
  | 'recognition'
  | 'pioneer'
  | 'authentication'
  | 'other'
  | (string & {}) // allow unknown categories without breaking the type

/** Row shown next to a user's name (slot=insignia) or in the strip below the
 * cover (slot=badge). */
export interface ProfileBadge {
  /** user_badges.id — the grant identifier, not the badge catalog id. */
  grantId: string
  /** Catalog identity */
  badgeId: string
  slug: string
  name: string
  description: string
  iconUrl: string | null
  category: BadgeCategory
  slot: BadgeSlot
  tier: string | null
  /** Pioneer-style label override (e.g. "Pionero #42") — comes from
   *  `user_badges.reason` when set, otherwise the badge name. */
  label: string | null
  awardedAt: string
  acceptanceStatus: BadgeAcceptanceStatus
  isSystem: boolean
}

/** Row shown on the public catalog page (`/insignias`). */
export interface CatalogBadge {
  id: string
  slug: string
  name: string
  description: string
  iconUrl: string | null
  category: BadgeCategory
  slot: BadgeSlot
  tier: string | null
  requestable: boolean
  requirementsMd: string
  isSystem: boolean
  /** How many users currently hold this badge (active + accepted). */
  grantCount: number
}
