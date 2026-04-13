import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/lib/insforge/server';
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

function mapComment(row: CommentRow, profileMap: Map<string, ProfileLite>) {
  return {
    id: row.id,
    user: mapProfileUser(profileMap.get(row.author_id), row.author_id),
    content: row.content,
    parentCommentId: row.parent_comment_id ?? undefined,
    likesCount: row.likes_count ?? 0,
    repliesCount: row.replies_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ entityType: string; id: string }> }
) {
  const { entityType, id } = await context.params;
  const column = resolveColumn(entityType);
  if (!column) return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '20') || 20, 1), 100);
  const cursor = searchParams.get('cursor');

  const client = await getServerClient();
  let query = client.database
    .from('comments')
    .select('*', { count: 'exact' })
    .eq(column, id)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as CommentRow[];
  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? sliced[sliced.length - 1]?.created_at : undefined;

  const authorIds = Array.from(new Set(sliced.map((r) => r.author_id)));
  const { data: profiles } = authorIds.length
    ? await client.database
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .in('id', authorIds)
    : { data: [] as ProfileLite[] };

  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);

  return NextResponse.json({
    comments: sliced.map((r) => mapComment(r, profileMap)),
    nextCursor,
    total: count ?? sliced.length,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ entityType: string; id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { entityType, id } = await context.params;
  const column = resolveColumn(entityType);
  if (!column) return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as {
    content?: string;
    parentCommentId?: string;
  };
  const content = (body.content ?? '').trim();
  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const authorId = me?.user?.id;
  if (!authorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const insertRow: Record<string, unknown> = {
    [column]: id,
    author_id: authorId,
    content,
    likes_count: 0,
    replies_count: 0,
  };
  if (body.parentCommentId) insertRow.parent_comment_id = body.parentCommentId;

  const { data, error } = await client.database
    .from('comments')
    .insert(insertRow)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create comment' },
      { status: 500 }
    );
  }

  if (body.parentCommentId) {
    const { count } = await client.database
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('parent_comment_id', body.parentCommentId);
    await client.database
      .from('comments')
      .update({ replies_count: count ?? 0 })
      .eq('id', body.parentCommentId);
  }

  const { count: totalComments } = await client.database
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq(column, id)
    .is('parent_comment_id', null);

  const table = entityType === 'photos' ? 'profile_photos' : 'profile_videos';
  await client.database
    .from(table)
    .update({ comments_count: totalComments ?? 0 })
    .eq('id', id);

  const { data: profile } = await client.database
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .eq('id', authorId)
    .maybeSingle();

  const profileMap = new Map<string, ProfileLite>();
  if (profile) profileMap.set(authorId, profile as ProfileLite);

  return NextResponse.json(mapComment(data as CommentRow, profileMap));
}
