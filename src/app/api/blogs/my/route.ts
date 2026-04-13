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

  const { data, error } = await client.database
    .from('blogs')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as BlogRow[];
  const { data: profile } = await client.database
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .eq('id', userId)
    .maybeSingle();

  const owners = new Map<string, OwnerProfile>();
  if (profile) owners.set(userId, profile as OwnerProfile);

  return NextResponse.json(rows.map((r) => mapBlog(r, owners, { userId, followingIds: new Set() })));
}
