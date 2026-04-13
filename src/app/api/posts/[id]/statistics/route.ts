import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await context.params;
  const client = await getServerClient();

  const { data: post, error } = await client.database
    .from('posts')
    .select('id,reactions_count,comments_count,created_at')
    .eq('id', postId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const row = post as {
    id: string;
    reactions_count: Record<string, number> | null;
    comments_count: number | null;
    created_at: string;
  };

  const reactions = row.reactions_count ?? {};
  const totalReactions = Object.values(reactions).reduce(
    (sum, n) => sum + (typeof n === 'number' ? n : 0),
    0
  );

  return NextResponse.json({
    success: true,
    data: {
      postId: row.id,
      reactions,
      totalReactions,
      commentsCount: row.comments_count ?? 0,
      sharesCount: 0,
      createdAt: row.created_at,
    },
  });
}
