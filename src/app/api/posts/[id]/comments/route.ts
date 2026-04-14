import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';

type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await context.params;
  const client = await getServerClient();

  const { data, error } = await client
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: postId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { content?: string };
  const content = (body.content ?? '').trim();
  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const authorId = me?.user?.id;
  if (!authorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await client
    .from('comments')
    .insert({ post_id: postId, author_id: authorId, content })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create comment' },
      { status: 500 }
    );
  }

  const { count: commentsCount } = await client
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);

  await client
    .from('posts')
    .update({
      comments_count: commentsCount ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId);

  return NextResponse.json({ success: true, data: data as CommentRow });
}
