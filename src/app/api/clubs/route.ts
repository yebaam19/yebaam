import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import {
  ensureClubForumSpace,
  loadClubContext,
  mapClub,
  slugify,
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

  const baseSlug = slugify(name);
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: conflict } = await client
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!conflict) break;
    slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
  }

  const insertRow = {
    owner_id: userId,
    name,
    slug,
    description: typeof body.description === 'string' ? body.description : '',
    category: typeof body.category === 'string' ? body.category : 'OTRO',
    subcategory: typeof body.subcategory === 'string' ? body.subcategory : null,
    privacy: typeof body.privacy === 'string' ? body.privacy : 'PUBLIC',
    profile_image_url:
      typeof body.profileImageUrl === 'string' ? body.profileImageUrl : null,
    cover_image_url: typeof body.coverImageUrl === 'string' ? body.coverImageUrl : null,
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

  const ctx = await loadClubContext(client, [row], userId);
  return NextResponse.json(mapClub(row, { userId, ...ctx }, ctx.owners.get(row.owner_id)));
}
