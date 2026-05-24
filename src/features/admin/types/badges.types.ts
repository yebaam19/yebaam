import type {
  BadgeAcceptanceStatus,
  BadgeCategory,
  BadgeRequestStatus,
  BadgeSlot,
  BadgeVisibility,
} from '@/features/badges/types/badges.types'

/** Row shown in the admin list at /admin/badges. */
export interface AdminBadgeRow {
  id: string
  slug: string
  name: string
  description: string
  iconUrl: string | null
  category: BadgeCategory
  slot: BadgeSlot
  visibility: BadgeVisibility
  tier: string | null
  isUnique: boolean
  requestable: boolean
  autoAccept: boolean
  isSystem: boolean
  deletedAt: string | null
  grantCount: number
  pendingRequestCount: number
  createdAt: string
  requirementsMd: string
}

/** Payload for createBadge / updateBadge server actions. */
export interface BadgeFormInput {
  slug: string
  name: string
  description: string
  iconCfImageId: string | null
  category: string
  slot: BadgeSlot
  visibility: BadgeVisibility
  tier: string | null
  isUnique: boolean
  requestable: boolean
  autoAccept: boolean
  requirementsMd: string
}

/** Row in the Grants tab on a badge's detail page. */
export interface UserBadgeGrant {
  id: string
  userId: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  awardedBy: string | null
  awardedByUsername: string | null
  awardedAt: string
  reason: string | null
  acceptanceStatus: BadgeAcceptanceStatus
  acceptedAt: string | null
  declinedAt: string | null
  revokedAt: string | null
  revokeReason: string | null
  isHidden: boolean
}

/** Row in the Audit tab. */
export interface BadgeAuditRow {
  id: string
  action:
    | 'create'
    | 'update'
    | 'soft_delete'
    | 'restore'
    | 'grant'
    | 'revoke'
    | 'request_approve'
    | 'request_reject'
  badgeId: string | null
  badgeName: string | null
  userId: string | null
  username: string | null
  actorId: string | null
  actorUsername: string | null
  reason: string | null
  detail: Record<string, unknown> | null
  createdAt: string
}

/** Row in the Requests admin queue (/admin/badges/requests). */
export interface BadgeRequestRow {
  id: string
  status: BadgeRequestStatus
  badgeId: string
  badgeSlug: string
  badgeName: string
  badgeIconUrl: string | null
  userId: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  reason: string
  supportingCfImageIds: string[]
  createdAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  reviewedByUsername: string | null
  decisionReason: string | null
}

/** Quick-lookup user shape returned by lookupUserForGrant(). */
export interface AdminUserLookup {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}
