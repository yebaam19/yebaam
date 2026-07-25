import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import type { ClubMemberRow, ProfileLite } from '@/lib/api/clubs';
import { withImageVariant } from '@/lib/media/urls';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get('page') ?? '1') || 1, 1);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '20') || 20, 1), 100);
  const offset = (page - 1) * limit;

  const client = await getServerClient();

  const { data, error, count } = await client
    .from('club_members')
    .select('*', { count: 'exact' })
    .eq('club_id', id)
    .order('joined_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as ClubMemberRow[];
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await client
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .in('id', userIds)
    : { data: [] as ProfileLite[] };

  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);

  const members = rows.map((r) => {
    const p = profileMap.get(r.user_id);
    return {
      id: r.user_id,
      userId: r.user_id,
      username: p?.username ?? '',
      name: [p?.first_name, p?.last_name].filter(Boolean).join(' ') || p?.username || '',
      // Member-list avatars render small — ship the `avatar` variant.
      avatar: p?.avatar_url ? withImageVariant(p.avatar_url, 'avatar') : undefined,
      role: r.role,
      membershipTier: r.membership_tier,
      joinedAt: r.joined_at,
    };
  });

  const total = count ?? members.length;
  // NOTE: deliberately NOT CDN-cacheable. `club_members` RLS is
  // `user_id = auth.uid() OR is_club_viewable(club_id, auth.uid())`, so a private
  // club's roster is visible only to members; the `profiles` join is viewer-
  // dependent too (public OR self OR friends).
  return NextResponse.json({
    members,
    total,
    page,
    limit,
    hasMore: offset + members.length < total,
  });
}
