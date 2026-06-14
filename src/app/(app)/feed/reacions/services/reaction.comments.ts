import { supabase } from '@/utils/supabase/client';
import { getCurrentUserId } from '@/utils/supabase/current-user';
import {
  ReactionType,
  type Reaction,
  type ReactionCounts,
} from '../interfaces/reaction.interfaces';
import {
  type DbReaction,
  type DbReactionType,
  emptyCounts,
  rowToReaction,
  toClientType,
  toDbType,
} from './reaction.mappers';
import { hydrateUsers, isDuplicateUserCommentReactionError } from './reaction.queries';

/**
 * Comment reactions — same `reactions` table as post reactions; the schema
 * enforces post_id XOR comment_id via a CHECK constraint. These are plain
 * functions (no instance state) consumed by `ReactionService` as the comment
 * half of the `reactionService` singleton.
 */

export async function reactToComment(commentId: string, type: ReactionType): Promise<Reaction> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const dbType = toDbType(type);
  const rowPayload = { type: dbType, user_id: userId, comment_id: commentId };

  const { data: updatedRows, error: updateError } = await supabase
    .from('reactions')
    .update({ type: dbType })
    .eq('user_id', userId)
    .eq('comment_id', commentId)
    .select('*');
  if (updateError) throw new Error(updateError.message || 'Error al reaccionar');

  const fromUpdate = updatedRows?.[0];
  if (fromUpdate) {
    const row = fromUpdate as DbReaction;
    const users = await hydrateUsers([row]);
    return rowToReaction(row, users);
  }

  const { data: inserted, error: insertError } = await supabase
    .from('reactions')
    .insert([rowPayload])
    .select('*')
    .single();
  if (!insertError && inserted) {
    const row = inserted as DbReaction;
    const users = await hydrateUsers([row]);
    return rowToReaction(row, users);
  }

  if (insertError && isDuplicateUserCommentReactionError(insertError)) {
    const { data: afterRace, error: retryError } = await supabase
      .from('reactions')
      .update({ type: dbType })
      .eq('user_id', userId)
      .eq('comment_id', commentId)
      .select('*')
      .single();
    if (retryError || !afterRace) throw new Error(retryError?.message || 'Error al reaccionar');
    const row = afterRace as DbReaction;
    const users = await hydrateUsers([row]);
    return rowToReaction(row, users);
  }

  throw new Error(insertError?.message || 'Error al reaccionar');
}

export async function unreactComment(commentId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('user_id', userId)
    .eq('comment_id', commentId);
  if (error) throw new Error(error.message || 'Error al quitar reacción');
}

export async function getMyReactionsForComments(
  commentIds: string[],
): Promise<Record<string, Reaction | null>> {
  const result: Record<string, Reaction | null> = {};
  for (const id of commentIds) result[id] = null;
  if (commentIds.length === 0) return result;

  const userId = await getCurrentUserId();
  if (!userId) return result;

  const { data, error } = await supabase
    .from('reactions')
    .select('*')
    .eq('user_id', userId)
    .in('comment_id', commentIds);
  if (error || !data) return result;

  for (const row of data as DbReaction[]) {
    const cid = row.comment_id;
    if (cid) result[cid] = rowToReaction(row, new Map());
  }
  return result;
}

export async function getCountsForComments(
  commentIds: string[],
): Promise<Record<string, ReactionCounts>> {
  const result: Record<string, ReactionCounts> = {};
  for (const id of commentIds) result[id] = emptyCounts();
  if (commentIds.length === 0) return result;

  const { data, error } = await supabase
    .from('reactions')
    .select('comment_id, type')
    .in('comment_id', commentIds);
  if (error || !data) return result;

  for (const row of data as { comment_id: string; type: DbReactionType }[]) {
    const counts = result[row.comment_id] ?? emptyCounts();
    const key = toClientType(row.type);
    counts[key] = (counts[key] ?? 0) + 1;
    result[row.comment_id] = counts;
  }
  return result;
}
