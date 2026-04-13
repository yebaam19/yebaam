import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/lib/insforge/server';
import { resolveColumn } from '@/lib/api/profile-media';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ entityType: string; id: string; commentId: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { entityType, id, commentId } = await context.params;
  const column = resolveColumn(entityType);
  if (!column) return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });

  const client = await getServerClient();
  const { error } = await client.database
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq(column, id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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

  return NextResponse.json({ success: true });
}
