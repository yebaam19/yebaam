/**
 * Canonical keys for profiles Map (route slug vs stored username casing).
 */

import type { UserProfile } from '../interfaces/profile.interfaces'

export function profileMapKey(slug: string): string {
  return slug.trim().toLowerCase()
}

/**
 * Writes profile under canonical username key(s) so lookups by URL slug always hit.
 */
export function putProfileInProfilesMap(
  profiles: Map<string, UserProfile>,
  profile: UserProfile,
  requestedSlug?: string | null,
): void {
  const canonicalKey = profileMapKey(profile.username)
  profiles.set(canonicalKey, profile)
  const req = requestedSlug?.trim()
  if (req && profileMapKey(req) !== canonicalKey) {
    profiles.set(profileMapKey(req), profile)
  }
}
