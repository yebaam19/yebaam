import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  if (!username) return NextResponse.json({ exists: false });

  const client = await getServerClient();

  // Resolve username -> user id (case-insensitive).
  const { data: profile } = await client
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle();
  const target = profile as { id: string } | null;
  if (!target) return NextResponse.json({ exists: false });

  // Caller (may be unauthenticated).
  const { data: userData } = await client.auth.getUser();
  const callerId = userData.user?.id ?? null;
  const isOwner = callerId === target.id;

  const { data: pro } = await client
    .from('professional_profiles')
    .select('id, visibility')
    .eq('user_id', target.id)
    .maybeSingle();

  if (!pro) return NextResponse.json({ exists: false });
  const row = pro as { id: string; visibility: 'PUBLIC' | 'PRIVATE' | 'LIMITED' };

  if (isOwner) return NextResponse.json({ exists: true });
  if (row.visibility === 'PUBLIC') return NextResponse.json({ exists: true });

  // PRIVATE / LIMITED: don't surface the button to non-owners.
  // (LIMITED = friends-only could be expanded later by checking friendship.)
  return NextResponse.json({ exists: false });
}
