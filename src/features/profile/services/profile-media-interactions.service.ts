export type ReactionType = 'like' | 'love' | 'wow' | 'haha' | 'sad' | 'angry';
export type EntityType = 'photo' | 'video';

export interface Reaction {
  id: string;
  type: ReactionType;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  content: string;
  parentCommentId?: string;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReactionsResponse {
  reactions: Reaction[];
  counts: Record<ReactionType, number>;
  total: number;
}

export interface CommentsResponse {
  comments: Comment[];
  nextCursor?: string;
  total: number;
}

type JsonRecord = Record<string, unknown>;

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'same-origin',
  });
  const payload = (await response.json().catch(() => ({}))) as JsonRecord;
  if (!response.ok) {
    const message = (payload as { error?: string }).error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

function segment(entityType: EntityType): 'photos' | 'videos' {
  return entityType === 'photo' ? 'photos' : 'videos';
}

class ProfileMediaInteractionsService {
  private basePath(entityType: EntityType, entityId: string): string {
    return `/api/profile/${segment(entityType)}/${entityId}`;
  }

  async react(entityType: EntityType, entityId: string, type: ReactionType): Promise<Reaction> {
    return jsonFetch<Reaction>(`${this.basePath(entityType, entityId)}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async unreact(entityType: EntityType, entityId: string): Promise<void> {
    await jsonFetch<{ success: true }>(`${this.basePath(entityType, entityId)}/reactions`, {
      method: 'DELETE',
    });
  }

  async getReactions(
    entityType: EntityType,
    entityId: string,
    type?: ReactionType,
  ): Promise<ReactionsResponse> {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    return jsonFetch<ReactionsResponse>(
      `${this.basePath(entityType, entityId)}/reactions${qs}`,
    );
  }

  async getMyReaction(entityType: EntityType, entityId: string): Promise<Reaction | null> {
    const payload = await jsonFetch<{ reaction: Reaction | null }>(
      `${this.basePath(entityType, entityId)}/reactions/me`,
    );
    return payload.reaction ?? null;
  }

  async comment(
    entityType: EntityType,
    entityId: string,
    content: string,
    parentCommentId?: string,
  ): Promise<Comment> {
    return jsonFetch<Comment>(`${this.basePath(entityType, entityId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentCommentId }),
    });
  }

  async getComments(
    entityType: EntityType,
    entityId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<CommentsResponse> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return jsonFetch<CommentsResponse>(
      `${this.basePath(entityType, entityId)}/comments?${params.toString()}`,
    );
  }

  async getCommentReplies(
    entityType: EntityType,
    entityId: string,
    commentId: string,
  ): Promise<Comment[]> {
    const payload = await jsonFetch<{ replies: Comment[] }>(
      `${this.basePath(entityType, entityId)}/comments/${commentId}/replies`,
    );
    return payload.replies ?? [];
  }

  async deleteComment(
    entityType: EntityType,
    entityId: string,
    commentId: string,
  ): Promise<void> {
    await jsonFetch<{ success: true }>(
      `${this.basePath(entityType, entityId)}/comments/${commentId}`,
      { method: 'DELETE' },
    );
  }
}

export const profileMediaInteractionsService = new ProfileMediaInteractionsService();
