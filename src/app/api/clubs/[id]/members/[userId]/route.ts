import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/lib/insforge/server';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, userId } = await context.params;
  const client = await getServerClient();

  const { error } = await client.database
    .from('club_members')
    .delete()
    .eq('club_id', id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Member removed' });
}
