'use server'

import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { lookupUserForGrant } from '@/features/admin/server/badges.server'
import type { AdminUserLookup } from '@/features/admin/types/badges.types'

/** Thin server-action wrapper around the lookup helper so client components
 *  (UserSearchToGrant) can call it via a debounced effect. */
export async function lookupUserAction(query: string): Promise<AdminUserLookup[]> {
  await requirePlatformAdmin()
  return lookupUserForGrant(query)
}
