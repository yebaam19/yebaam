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

type DbReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

type DbReaction = {
  id: string;
  type: DbReactionType;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  created_at: string;
};

type DbProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

function toClientType(t: DbReactionType): ReactionType {
  return t.toUpperCase() as ReactionType;
}
function toDbType(t: ReactionType): DbReactionType {
  return t.toLowerCase() as DbReactionType;
}

function rowToReaction(row: DbReaction, users: Map<string, DbProfile>): Reaction {
  const profile = users.get(row.user_id);
  return {
    id: row.id,
    postId: row.post_id ?? '',
    userId: row.user_id,
    type: toClientType(row.type),
    createdAt: row.created_at,
    updatedAt: row.created_at,
    user: profile
      ? {
          id: profile.id,
          username: profile.username ?? '',
          firstName: profile.first_name ?? '',
          lastName: profile.last_name ?? '',
          avatar: profile.avatar_url ?? undefined,
        }
      : undefined,
  };
}

async function hydrateUsers(rows: DbReaction[]): Promise<Map<string, DbProfile>> {
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

function emptyCounts(): ReactionCounts {
  return { LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 };
}

function isDuplicateUserPostReactionError(err: { message?: string } | null | undefined): boolean {
  const msg = err?.message ?? '';
  return (
    msg.includes('idx_reactions_user_post') ||
    msg.includes('duplicate key') ||
    msg.includes('23505')
  );
}

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
}

export const reactionService = new ReactionService();
