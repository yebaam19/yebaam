import { supabase } from '@/utils/supabase/client';
import { getCurrentUserId } from '@/utils/supabase/current-user';
import {
  ReactionType,
  type CreateReactionDTO,
  type GetReactionsFilters,
  type Reaction,
  type ReactionCounts,
  type ReactionsResponse,
  type UpdateReactionDTO,
} from '../interfaces/reaction.interfaces';
import {
  type DbReaction,
  type DbReactionType,
  emptyCounts,
  rowToReaction,
  toClientType,
  toDbType,
} from './reaction.mappers';
import {
  hydrateUsers,
  isDuplicateUserCommentReactionError,
  isDuplicateUserPostReactionError,
} from './reaction.queries';

export class ReactionService {
  async react(data: CreateReactionDTO): Promise<Reaction> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const dbType = toDbType(data.type);
    const rowPayload = { type: dbType, user_id: userId, post_id: data.postId };

    // Update first: one round-trip when a row already exists (avoids stale SELECT missing a row).
    const { data: updatedRows, error: updateError } = await supabase
      .from('reactions')
      .update({ type: dbType })
      .eq('user_id', userId)
      .eq('post_id', data.postId)
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

    // Lost race: another request inserted between UPDATE and INSERT.
    if (insertError && isDuplicateUserPostReactionError(insertError)) {
      const { data: afterRace, error: retryError } = await supabase
        .from('reactions')
        .update({ type: dbType })
        .eq('user_id', userId)
        .eq('post_id', data.postId)
        .select('*')
        .single();
      if (retryError || !afterRace) throw new Error(retryError?.message || 'Error al reaccionar');
      const row = afterRace as DbReaction;
      const users = await hydrateUsers([row]);
      return rowToReaction(row, users);
    }

    throw new Error(insertError?.message || 'Error al reaccionar');
  }

  async updateReaction(postId: string, data: UpdateReactionDTO): Promise<Reaction> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const { data: updated, error } = await supabase
      .from('reactions')
      .update({ type: toDbType(data.type) })
      .eq('user_id', userId)
      .eq('post_id', postId)
      .select('*')
      .single();
    if (error || !updated) throw new Error(error?.message || 'Error al actualizar reacción');
    const row = updated as DbReaction;
    const users = await hydrateUsers([row]);
    return rowToReaction(row, users);
  }

  async unreact(postId: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);
    if (error) throw new Error(error.message || 'Error al quitar reacción');
  }

  async getByPost(postId: string, filters?: GetReactionsFilters): Promise<ReactionsResponse> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('reactions')
      .select('*', { count: 'exact' })
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.type) query = query.eq('type', toDbType(filters.type));

    const { data, error, count } = await query;
    if (error) throw new Error(error.message || 'Error al obtener reacciones');

    const rows = (data ?? []) as DbReaction[];
    const users = await hydrateUsers(rows);
    const reactions = rows.map((r) => rowToReaction(r, users));

    const counts = await this.getCounts(postId);
    const currentUserReaction = await this.getMyReaction(postId);

    return {
      reactions,
      counts,
      currentUserReaction,
      total: count ?? reactions.length,
    };
  }

  async getMyReaction(postId: string): Promise<Reaction | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('reactions')
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as DbReaction;
    return rowToReaction(row, new Map());
  }

  async getMyReactionsForPosts(postIds: string[]): Promise<Record<string, Reaction | null>> {
    const result: Record<string, Reaction | null> = {};
    for (const id of postIds) result[id] = null;

    if (postIds.length === 0) return result;

    const userId = await getCurrentUserId();
    if (!userId) return result;

    const { data, error } = await supabase
      .from('reactions')
      .select('*')
      .eq('user_id', userId)
      .in('post_id', postIds);
    if (error || !data) return result;

    for (const row of data as DbReaction[]) {
      const postId = row.post_id;
      if (postId) result[postId] = rowToReaction(row, new Map());
    }
    return result;
  }

  async getCounts(postId: string): Promise<ReactionCounts> {
    const { data, error } = await supabase
      .from('reactions')
      .select('type')
      .eq('post_id', postId);
    if (error || !data) return emptyCounts();

    const counts = emptyCounts();
    for (const row of data as { type: DbReactionType }[]) {
      const key = toClientType(row.type);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }

  // ===========================================================
  // Comment reactions — same `reactions` table; schema enforces
  // post_id XOR comment_id via CHECK constraint.
  // ===========================================================

  async reactToComment(commentId: string, type: ReactionType): Promise<Reaction> {
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

  async unreactComment(commentId: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('user_id', userId)
      .eq('comment_id', commentId);
    if (error) throw new Error(error.message || 'Error al quitar reacción');
  }

  async getMyReactionsForComments(commentIds: string[]): Promise<Record<string, Reaction | null>> {
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

  async getCountsForComments(commentIds: string[]): Promise<Record<string, ReactionCounts>> {
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
}

export const reactionService = new ReactionService();
