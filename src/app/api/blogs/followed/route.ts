import { NextResponse } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/lib/insforge/server';
import { mapBlog, type BlogRow, type OwnerProfile } from '@/lib/api/blogs';

export async function GET() {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json([], { status: 401 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json([], { status: 401 });

  const { data: follows } = await client.database
    .from('blog_follows')
    .select('blog_id')
    .eq('user_id', userId);

  const blogIds = ((follows ?? []) as { blog_id: string }[]).map((r) => r.blog_id);
  if (blogIds.length === 0) return NextResponse.json([]);

  const { data: rows, error } = await client.database
    .from('blogs')
    .select('*')
    .in('id', blogIds)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const blogRows = (rows ?? []) as BlogRow[];
  const ownerIds = Array.from(new Set(blogRows.map((r) => r.owner_id)));
  const { data: owners } = ownerIds.length
    ? await client.database
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .in('id', ownerIds)
    : { data: [] as OwnerProfile[] };

  const ownerMap = new Map<string, OwnerProfile>();
  for (const o of (owners ?? []) as OwnerProfile[]) ownerMap.set(o.id, o);

  const followingSet = new Set(blogIds);
  return NextResponse.json(
    blogRows.map((r) => mapBlog(r, ownerMap, { userId, followingIds: followingSet }))
  );
}
