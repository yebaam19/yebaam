import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { isUuid } from '@/lib/supabase-filter';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId')?.trim();
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  // `userId` is interpolated into a PostgREST `.or()` filter string below —
  // only a canonical UUID may pass, anything else could inject conditions.
  if (!isUuid(userId)) {
    return NextResponse.json({ error: 'userId must be a UUID' }, { status: 400 });
  }

  const client = await getServerClient();
  const { count, error } = await client
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: count ?? 0 });
}
