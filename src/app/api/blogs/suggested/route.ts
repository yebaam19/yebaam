import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';
import { mapBlog, type BlogRow, type OwnerProfile } from '@/lib/api/blogs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '10') || 10, 1), 50);

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const userId = me?.user?.id ?? null;

  const { data, error } = await client.database
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as BlogRow[];
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id)));
  const { data: owners } = ownerIds.length
    ? await client.database
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .in('id', ownerIds)
    : { data: [] as OwnerProfile[] };

  const ownerMap = new Map<string, OwnerProfile>();
  for (const o of (owners ?? []) as OwnerProfile[]) ownerMap.set(o.id, o);

  const followingIds = new Set<string>();
  if (userId) {
    const { data: follows } = await client.database
      .from('blog_follows')
      .select('blog_id')
      .eq('user_id', userId)
      .in('blog_id', rows.map((r) => r.id));
    for (const f of (follows ?? []) as { blog_id: string }[]) followingIds.add(f.blog_id);
  }

  return NextResponse.json(rows.map((r) => mapBlog(r, ownerMap, { userId, followingIds })));
}
