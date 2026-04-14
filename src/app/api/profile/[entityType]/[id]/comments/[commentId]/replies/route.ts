import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { mapProfileUser, resolveColumn, type ProfileLite } from '@/lib/api/profile-media';

type CommentRow = {
  id: string;
  author_id: string;
  content: string;
  parent_comment_id: string | null;
  likes_count: number | null;
  replies_count: number | null;
  created_at: string;
  updated_at: string;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ entityType: string; id: string; commentId: string }> }
) {
  const { entityType, commentId } = await context.params;
  if (!resolveColumn(entityType)) {
    return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
  }

  const client = await getServerClient();
  const { data, error } = await client
    .from('comments')
    .select('*')
    .eq('parent_comment_id', commentId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as CommentRow[];
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
  const { data: profiles } = authorIds.length
    ? await client
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .in('id', authorIds)
    : { data: [] as ProfileLite[] };

  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);

  return NextResponse.json({
    replies: rows.map((r) => ({
      id: r.id,
      user: mapProfileUser(profileMap.get(r.author_id), r.author_id),
      content: r.content,
      parentCommentId: r.parent_comment_id ?? undefined,
      likesCount: r.likes_count ?? 0,
      repliesCount: r.replies_count ?? 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
}
