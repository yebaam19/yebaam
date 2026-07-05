import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveImage } from '@/lib/media/urls'
import type { PublicMessageWithSender } from '../types'

/**
 * id-first avatar resolution for chat-publico.
 *
 * `profiles.avatar_cloudflare_id` is always written on avatar upload; the
 * legacy `avatar_url` column is only a fallback for rows created before the
 * Cloudflare migration. Everything in this feature that snapshots or renders
 * a profile avatar goes through these helpers so the preference order lives
 * in one place. This module is client-safe (no 'server-only').
 */

type ProfileAvatarRow = {
  avatar_cloudflare_id?: string | null
  avatar_url?: string | null
}

/** Prefer the Cloudflare id (via resolveImage); fall back to the legacy URL column. */
export function profileAvatarUrl(row: ProfileAvatarRow | null | undefined): string | null {
  if (!row) return null
  try {
    return resolveImage(
      { cloudflare_image_id: row.avatar_cloudflare_id ?? null, avatar_url: row.avatar_url ?? null },
      'avatar',
    )
  } catch {
    // NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH missing — legacy URL or nothing.
    return row.avatar_url ?? null
  }
}

/**
 * Resolve the `sender` join of message rows: the wire shape keeps
 * `sender.avatar_url`, but its value becomes the id-derived delivery URL
 * (queries select `avatar_cloudflare_id` alongside it). Rows without a
 * sender join pass through untouched.
 */
export function resolveMessageSenderAvatars(
  rows: PublicMessageWithSender[],
): PublicMessageWithSender[] {
  return rows.map((row) =>
    row.sender
      ? { ...row, sender: { ...row.sender, avatar_url: profileAvatarUrl(row.sender) } }
      : row,
  )
}

/** Fetch a user's avatar (id-first) for identity snapshots (presence / messages). */
export async function fetchProfileAvatarUrl(
  client: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await client
    .from('profiles')
    .select('avatar_cloudflare_id, avatar_url')
    .eq('id', userId)
    .maybeSingle()
  return profileAvatarUrl(data as ProfileAvatarRow | null)
}
