import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';

const VALID_TIERS = ['FREE', 'BASIC', 'PREMIUM', 'VIP'];

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { membershipTier?: string };
  const tierRaw = (body.membershipTier ?? 'FREE').toUpperCase();
  const tier = VALID_TIERS.includes(tierRaw) ? tierRaw : 'FREE';

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing } = await client
    .from('club_members')
    .select('club_id')
    .eq('club_id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    const { error } = await client
      .from('club_members')
      .insert({ club_id: id, user_id: userId, role: 'MEMBER', membership_tier: tier });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Joined club' });
}
