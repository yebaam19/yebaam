import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/lib/insforge/server';
import {
  loadMyReactions,
  loadProfilesForPosts,
  mapPost,
  type PostRow,
} from '@/lib/api/posts';

async function getUserId() {
  const client = await getServerClient();
  const { data } = await client.auth.getCurrentUser();
  return { client, userId: data?.user?.id ?? null };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { client, userId } = await getUserId();

  const { data, error } = await client.database
    .from('posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const row = data as PostRow;
  const profiles = await loadProfilesForPosts(client, [row]);
  const myReactions = await loadMyReactions(client, [row.id], userId);
  return NextResponse.json({
    success: true,
    data: mapPost(row, profiles, myReactions.get(row.id) ?? null),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { client, userId } = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.content === 'string') patch.content = body.content;
  if (typeof body.backgroundColor === 'string') patch.background_color = body.backgroundColor;
  if (Array.isArray(body.mediaFiles)) patch.media_files = body.mediaFiles;
  if (typeof body.privacy === 'string') {
    const p = (body.privacy as string).toLowerCase();
    patch.privacy = ['public', 'friends', 'private'].includes(p) ? p : 'public';
  }

  const { data, error } = await client.database
    .from('posts')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update post' },
      { status: 500 }
    );
  }

  const row = data as PostRow;
  const profiles = await loadProfilesForPosts(client, [row]);
  const myReactions = await loadMyReactions(client, [row.id], userId);
  return NextResponse.json({
    success: true,
    data: mapPost(row, profiles, myReactions.get(row.id) ?? null),
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const client = await getServerClient();
  const { error } = await client.database.from('posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
