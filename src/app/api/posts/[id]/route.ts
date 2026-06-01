import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import {
  loadMyReactions,
  loadProfilesForPosts,
  mapPost,
  type PostRow,
} from '@/lib/api/posts';

async function getUserId() {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return { client, userId: data?.user?.id ?? null };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { client, userId } = await getUserId();

  const { data, error } = await client
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

  // Scope the update to the caller so we get a clear error when it's not
  // theirs, and so an RLS miss can't masquerade as a generic zero-row update.
  const { data, error } = await client
    .from('posts')
    .update(patch)
    .eq('id', id)
    .eq('author_id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('[api/posts PATCH] supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: 'Post not found or you are not the author' },
      { status: 404 }
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
  const { id } = await context.params;
  const { client, userId } = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Authorization is enforced by RLS, which allows a delete when the caller is
  // the post author (posts_delete_own) OR the owner of the post's blog wall
  // (posts_delete_blog_owner). A 0-row result means neither applied.
  const { data, error } = await client
    .from('posts')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[api/posts DELETE] supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: 'Post not found or you are not allowed to delete it' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true });
}
