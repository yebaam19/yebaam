import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';

const VALID_ROLES = ['ADMIN', 'MODERATOR', 'MEMBER'];

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, userId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { role?: string };
  const roleRaw = (body.role ?? '').toUpperCase();
  if (!VALID_ROLES.includes(roleRaw)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const client = await getServerClient();
  const { error } = await client
    .from('club_members')
    .update({ role: roleRaw })
    .eq('club_id', id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Role updated' });
}
