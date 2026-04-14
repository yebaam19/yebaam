import { supabase } from '@/utils/supabase/client';
import type {
  Comment,
  CommentAuthor,
  CreateCommentDTO,
  DeleteCommentDTO,
  GetCommentsFilters,
  GetCommentsResponse,
  UpdateCommentDTO,
} from '../interfaces/comment.interfaces';

// Realtime delivery is handled entirely by Supabase's postgres_changes stream
// on the `comments` table — subscribers receive INSERT/UPDATE/DELETE for any
// row that matches their filter. No manual publish step needed.

type DbComment = {
  id: string;
  post_id: string;
  parent_comment_id: string | null;
  author_id: string;
  content: string;
  mentions: string[];
  likes_count: number;
  replies_count: number;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

function profileToAuthor(profile: DbProfile | undefined, fallbackId: string): CommentAuthor {
  if (!profile) {
    return { id: fallbackId, username: '', firstName: '', lastName: '', avatar: null };
  }
  return {
    id: profile.id,
    username: profile.username ?? '',
    firstName: profile.first_name ?? '',
    lastName: profile.last_name ?? '',
    avatar: profile.avatar_url ?? null,
  };
}

async function hydrateAuthors(rows: DbComment[]): Promise<Map<string, DbProfile>> {
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
  if (authorIds.length === 0) return new Map();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .in('id', authorIds);
  const map = new Map<string, DbProfile>();
  for (const p of (data ?? []) as DbProfile[]) map.set(p.id, p);
  return map;
}

function rowToComment(row: DbComment, authors: Map<string, DbProfile>): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    content: row.content,
    author: profileToAuthor(authors.get(row.author_id), row.author_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parentId: row.parent_comment_id,
    isEdited: row.is_edited,
    editedAt: row.edited_at ?? undefined,
    likesCount: row.likes_count,
    repliesCount: row.replies_count,
  };
}

export class CommentService {
  async create(data: CreateCommentDTO): Promise<Comment> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data: inserted, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: data.postId,
          author_id: userId,
          content: data.content,
          parent_comment_id: data.parentId ?? null,
        },
      ])
      .select('*')
      .single();
    if (error || !inserted) throw new Error(error?.message || 'Error al crear comentario');

    const row = inserted as DbComment;
    const authors = await hydrateAuthors([row]);
    return rowToComment(row, authors);
  }

  async update(data: UpdateCommentDTO): Promise<Comment> {
    const { data: updated, error } = await supabase
      .from('comments')
      .update({
        content: data.content,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', data.commentId)
      .select('*')
      .single();
    if (error || !updated) throw new Error(error?.message || 'Error al actualizar comentario');

    const row = updated as DbComment;
    const authors = await hydrateAuthors([row]);
    return rowToComment(row, authors);
  }

  async delete(data: DeleteCommentDTO): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', data.commentId);
    if (error) throw new Error(error.message || 'Error al eliminar comentario');
  }

  async getByPost(filters: GetCommentsFilters): Promise<GetCommentsResponse> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('post_id', filters.postId)
      .range(from, to);

    if (filters.parentId === null || filters.parentId === undefined) {
      query = query.is('parent_comment_id', null);
    } else {
      query = query.eq('parent_comment_id', filters.parentId);
    }

    const ascending = filters.sortBy === 'oldest';
    query = query.order('created_at', { ascending });

    // PostgREST returns "Could not query the database for the schema cache"
    // while its schema cache is warming up. Retry a couple of times before
    // surfacing the error so the UI doesn't flicker on cold starts.
    let data: unknown = null;
    let error: { message?: string } | null = null;
    let count: number | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await query;
      data = result.data;
      error = result.error;
      count = result.count ?? null;
      if (!error) break;
      const msg = error.message ?? '';
      if (!/schema cache/i.test(msg)) break;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
    if (error) throw new Error(error.message || 'Error al obtener comentarios');

    const rows = (data ?? []) as DbComment[];
    const authors = await hydrateAuthors(rows);
    const comments = rows.map((r) => rowToComment(r, authors));

    return {
      comments,
      total: count ?? comments.length,
      page,
      limit,
      hasMore: (count ?? 0) > to + 1,
    };
  }

  async getById(commentId: string, _postId: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();
    if (error || !data) throw new Error(error?.message || 'Error al obtener comentario');

    const row = data as DbComment;
    const authors = await hydrateAuthors([row]);
    return rowToComment(row, authors);
  }

  async getReplies(_postId: string, commentId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('parent_comment_id', commentId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message || 'Error al obtener respuestas del comentario');

    const rows = (data ?? []) as DbComment[];
    const authors = await hydrateAuthors(rows);
    return rows.map((r) => rowToComment(r, authors));
  }
}

export const commentService = new CommentService();
