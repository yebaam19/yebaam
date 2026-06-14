import { supabase } from '@/utils/supabase/client';
import type { ProfileBadge } from '@/features/badges/types/badges.types';
import { mapBadge } from './profile.mappers';
import type { UserBadgeJoinedRow } from './profile.types';

/**
 * Fetches all badge grants for a user and splits them by slot + acceptance.
 * RLS already filters to public+accepted rows for non-owner viewers; if the
 * caller IS the owner, additional pending rows come back via the
 * `user_badges_select_self` policy.
 */
export async function fetchProfileBadges(userId: string): Promise<{
  insignias: ProfileBadge[];
  badges: ProfileBadge[];
  pendingBadges: ProfileBadge[];
}> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(
      `id, awarded_at, reason, acceptance_status, is_hidden,
       badge:badges!user_badges_badge_id_fkey(
         id, slug, name, description, icon_cf_image_id, category, slot, tier,
         is_system, visibility, deleted_at
       )`,
    )
    .eq('user_id', userId)
    .is('revoked_at', null)
    .order('awarded_at', { ascending: true });

  if (error) {
    console.error('[fetchProfileBadges]', error);
    return { insignias: [], badges: [], pendingBadges: [] };
  }

  const rows = (data ?? []) as unknown as UserBadgeJoinedRow[];
  const insignias: ProfileBadge[] = [];
  const badges: ProfileBadge[] = [];
  const pendingBadges: ProfileBadge[] = [];

  for (const r of rows) {
    const mapped = mapBadge(r);
    if (!mapped) continue;
    // Skip soft-deleted or private badges (RLS may still surface them to admin viewers).
    if (r.badge?.deleted_at) continue;
    if (r.badge?.visibility !== 'public') continue;

    if (mapped.acceptanceStatus === 'pending') {
      pendingBadges.push(mapped);
      continue;
    }
    if (mapped.acceptanceStatus !== 'accepted' || r.is_hidden) continue;
    if (mapped.slot === 'insignia') insignias.push(mapped);
    else badges.push(mapped);
  }

  return { insignias, badges, pendingBadges };
}
