import {
  ReactionType,
  type Reaction,
  type ReactionCounts,
} from '../interfaces/reaction.interfaces';

export type DbReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export type DbReaction = {
  id: string;
  type: DbReactionType;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  created_at: string;
};

export type DbProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export function toClientType(t: DbReactionType): ReactionType {
  return t.toUpperCase() as ReactionType;
}
export function toDbType(t: ReactionType): DbReactionType {
  return t.toLowerCase() as DbReactionType;
}

export function rowToReaction(row: DbReaction, users: Map<string, DbProfile>): Reaction {
  const profile = users.get(row.user_id);
  return {
    id: row.id,
    postId: row.post_id ?? '',
    commentId: row.comment_id ?? undefined,
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

export function emptyCounts(): ReactionCounts {
  return { LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 };
}
