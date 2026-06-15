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

  // Only the club owner may assign roles (mirrors club_members_update_owner RLS).
  const { data: caller } = await client.auth.getUser();
  const callerId = caller?.user?.id ?? null;
  if (!callerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: club } = await client
    .from('clubs')
    .select('owner_id')
    .eq('id', id)
    .maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  if ((club as { owner_id: string }).owner_id !== callerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: updated, error } = await client
    .from('club_members')
    .update({ role: roleRaw })
    .eq('club_id', id)
    .eq('user_id', userId)
    .select('user_id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // 0-row update means an RLS-blocked write or a non-existent membership.
  if (!updated) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  return NextResponse.json({ message: 'Role updated' });
}
