import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import {
  ensureClubForumSpace,
  ensureClubPublicChat,
  generateUniqueClubSlug,
  loadClubContext,
  mapClub,
  type ClubRow,
} from '@/lib/api/clubs';

export async function GET() {
  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;

  const { data, error } = await client
    .from('clubs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as ClubRow[];
  const ctx = await loadClubContext(client, rows, viewerId);
  return NextResponse.json(
    rows.map((r) => mapClub(r, { userId: viewerId, ...ctx }, ctx.owners.get(r.owner_id)))
  );
}

export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const slug = await generateUniqueClubSlug(client, name);

  const insertRow = {
    owner_id: userId,
    name,
    slug,
    description: typeof body.description === 'string' ? body.description : '',
    category: typeof body.category === 'string' ? body.category : 'OTRO',
    subcategory: typeof body.subcategory === 'string' ? body.subcategory : null,
    privacy: typeof body.privacy === 'string' ? body.privacy : 'PUBLIC',
    profile_image_url:
      typeof body.profileImageUrl === 'string'
        ? body.profileImageUrl
        : typeof body.profileImage === 'string'
          ? body.profileImage
          : null,
    cover_image_url:
      typeof body.coverImageUrl === 'string'
        ? body.coverImageUrl
        : typeof body.coverImage === 'string'
          ? body.coverImage
          : null,
    membership_tiers: Array.isArray(body.membershipTiers)
      ? (body.membershipTiers as string[])
      : ['FREE'],
    rules: Array.isArray(body.rules) ? (body.rules as string[]) : [],
    location: typeof body.location === 'string' ? body.location : null,
    website: typeof body.website === 'string' ? body.website : null,
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
  };

  const { data, error } = await client
    .from('clubs')
    .insert(insertRow)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create club' },
      { status: 500 }
    );
  }

  const row = data as ClubRow;

  // Enroll owner as a member so the club shows up under "Mis Clubes" and
  // owner-scoped RLS checks (is_club_member) pass.
  await client
    .from('club_members')
    .upsert(
      { club_id: row.id, user_id: userId, role: 'OWNER', membership_tier: 'FREE' },
      { onConflict: 'club_id,user_id' },
    );

  // Provision the club's forum space (idempotent, service-role) so the Foro tab
  // works immediately. Non-fatal: we don't want a foro hiccup to break club creation.
  await ensureClubForumSpace({
    id: row.id,
    name: row.name,
    slug: row.slug,
    owner_id: row.owner_id,
    privacy: row.privacy,
  }).catch((err) => {
    console.error('[clubs.POST] ensureClubForumSpace failed', err);
  });

  // Provision the club's public chat (idempotent, service-role) so the
  // "Chat público" panel works out of the box.
  await ensureClubPublicChat({
    id: row.id,
    name: row.name,
    owner_id: row.owner_id,
  }).catch((err) => {
    console.error('[clubs.POST] ensureClubPublicChat failed', err);
  });

  const ctx = await loadClubContext(client, [row], userId);
  return NextResponse.json(mapClub(row, { userId, ...ctx }, ctx.owners.get(row.owner_id)));
}
