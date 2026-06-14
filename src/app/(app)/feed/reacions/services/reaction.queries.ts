import { supabase } from '@/utils/supabase/client';
import type { DbProfile, DbReaction } from './reaction.mappers';

export async function hydrateUsers(rows: DbReaction[]): Promise<Map<string, DbProfile>> {
  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .in('id', ids);
  const map = new Map<string, DbProfile>();
  for (const p of (data ?? []) as DbProfile[]) map.set(p.id, p);
  return map;
}

export function isDuplicateUserPostReactionError(
  err: { message?: string } | null | undefined,
): boolean {
  const msg = err?.message ?? '';
  return (
    msg.includes('idx_reactions_user_post') ||
    msg.includes('duplicate key') ||
    msg.includes('23505')
  );
}

export function isDuplicateUserCommentReactionError(
  err: { message?: string } | null | undefined,
): boolean {
  return /duplicate key|23505|idx_reactions_user_comment/.test(err?.message ?? '');
}
