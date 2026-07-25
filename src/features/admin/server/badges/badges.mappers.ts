import { cfImageUrl } from '@/features/badges/server/cf'
import { withImageVariant } from '@/lib/media/urls'
import type {
  AdminBadgeRow,
  AdminUserLookup,
  BadgeAuditRow,
  BadgeRequestRow,
  UserBadgeGrant,
} from '@/features/admin/types/badges.types'

/**
 * Pure row mappers + the shared select column list for the `/admin/badges/**`
 * server reads. Extracted from `badges.server.ts` so the DB row → view-model
 * translation lives in one place (the 22-field select string and the badge
 * mapper were duplicated between the list and single-detail reads).
 */

/** The badge select string shared by the list + single-detail reads. */
export const BADGE_COLUMNS =
  'id, slug, name, description, icon_cf_image_id, category, slot, visibility, tier, is_unique, requestable, auto_accept, evidence_required, is_system, deleted_at, created_at, requirements_md'

export type BadgeListRow = {
  id: string
  slug: string
  name: string
  description: string
  icon_cf_image_id: string | null
  category: string
  slot: 'insignia' | 'badge'
  visibility: 'public' | 'private'
  tier: string | null
  is_unique: boolean
  requestable: boolean
  auto_accept: boolean
  evidence_required: boolean
  is_system: boolean
  deleted_at: string | null
  created_at: string
  requirements_md: string
}

/** `[first, last].filter(Boolean).join(' ')` with an optional fallback. */
export function fullName(
  first: string | null | undefined,
  last: string | null | undefined,
  fallback?: string | null,
): string | null {
  return [first, last].filter(Boolean).join(' ') || (fallback ?? null)
}

/** Map a raw badge row + its aggregated counts to the admin view-model. */
export function mapBadgeRow(
  row: BadgeListRow,
  counts: Record<string, { grants: number; requests: number }>,
): AdminBadgeRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    iconUrl: cfImageUrl(row.icon_cf_image_id),
    category: row.category,
    slot: row.slot,
    visibility: row.visibility,
    tier: row.tier,
    isUnique: Boolean(row.is_unique),
    requestable: Boolean(row.requestable),
    autoAccept: Boolean(row.auto_accept),
    evidenceRequired: Boolean(row.evidence_required),
    isSystem: Boolean(row.is_system),
    deletedAt: row.deleted_at,
    grantCount: counts[row.id]?.grants ?? 0,
    pendingRequestCount: counts[row.id]?.requests ?? 0,
    createdAt: row.created_at,
    requirementsMd: row.requirements_md ?? '',
  }
}

// ---------- Grants ----------

type GrantRow = {
  id: string
  user_id: string
  awarded_by: string | null
  awarded_at: string
  reason: string | null
  acceptance_status: 'pending' | 'accepted' | 'declined'
  accepted_at: string | null
  declined_at: string | null
  revoked_at: string | null
  revoke_reason: string | null
  is_hidden: boolean
  recipient: {
    id: string
    username: string | null
    display_name: string | null
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
  granter: { id: string; username: string | null } | null
}

export function mapGrantRow(r: GrantRow): UserBadgeGrant {
  return {
    id: r.id,
    userId: r.user_id,
    username: r.recipient?.username ?? null,
    displayName:
      r.recipient?.display_name ??
      fullName(r.recipient?.first_name, r.recipient?.last_name),
    avatarUrl: r.recipient?.avatar_url ? withImageVariant(r.recipient.avatar_url, 'avatar') : null,
    awardedBy: r.awarded_by,
    awardedByUsername: r.granter?.username ?? null,
    awardedAt: r.awarded_at,
    reason: r.reason,
    acceptanceStatus: r.acceptance_status,
    acceptedAt: r.accepted_at,
    declinedAt: r.declined_at,
    revokedAt: r.revoked_at,
    revokeReason: r.revoke_reason,
    isHidden: Boolean(r.is_hidden),
  }
}

// ---------- Audit ----------

type AuditRow = {
  id: string
  action: BadgeAuditRow['action']
  badge_id: string | null
  user_id: string | null
  actor_id: string | null
  reason: string | null
  detail: Record<string, unknown> | null
  created_at: string
  badge: { name: string } | null
  recipient: { username: string | null } | null
  actor: { username: string | null } | null
}

export function mapAuditRow(r: AuditRow): BadgeAuditRow {
  return {
    id: r.id,
    action: r.action,
    badgeId: r.badge_id,
    badgeName: r.badge?.name ?? null,
    userId: r.user_id,
    username: r.recipient?.username ?? null,
    actorId: r.actor_id,
    actorUsername: r.actor?.username ?? null,
    reason: r.reason,
    detail: r.detail,
    createdAt: r.created_at,
  }
}

// ---------- User lookup ----------

type UserLookupRow = {
  id: string
  username: string | null
  display_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

export function mapUserLookup(r: UserLookupRow): AdminUserLookup {
  return {
    id: r.id,
    username: r.username ?? '',
    displayName:
      r.display_name ??
      (fullName(r.first_name, r.last_name, r.username) || ''),
    avatarUrl: r.avatar_url ? withImageVariant(r.avatar_url, 'avatar') : null,
  }
}

// ---------- Requests ----------

type RequestListRow = {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  badge_id: string
  user_id: string
  reason: string
  supporting_cf_image_ids: string[]
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  decision_reason: string | null
  badge: {
    slug: string
    name: string
    icon_cf_image_id: string | null
    evidence_required: boolean
  } | null
  requester: {
    id: string
    username: string | null
    display_name: string | null
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
  reviewer: { username: string | null } | null
}

export function mapRequestRow(r: RequestListRow): BadgeRequestRow {
  return {
    id: r.id,
    status: r.status,
    badgeId: r.badge_id,
    badgeSlug: r.badge?.slug ?? '',
    badgeName: r.badge?.name ?? '',
    badgeIconUrl: cfImageUrl(r.badge?.icon_cf_image_id),
    badgeEvidenceRequired: Boolean(r.badge?.evidence_required),
    userId: r.user_id,
    username: r.requester?.username ?? null,
    displayName:
      r.requester?.display_name ??
      fullName(r.requester?.first_name, r.requester?.last_name),
    avatarUrl: r.requester?.avatar_url ? withImageVariant(r.requester.avatar_url, 'avatar') : null,
    reason: r.reason,
    supportingCfImageIds: r.supporting_cf_image_ids ?? [],
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
    reviewedBy: r.reviewed_by,
    reviewedByUsername: r.reviewer?.username ?? null,
    decisionReason: r.decision_reason,
  }
}
