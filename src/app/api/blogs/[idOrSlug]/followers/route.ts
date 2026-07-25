import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { blogKey } from '@/lib/api/blogs';
import { withImageVariant } from '@/lib/media/urls';

type ProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

/** Paginated followers of a blog + the owner (PDF "Miembros y Seguidores"). */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '30') || 30, 1), 100);
  const page = Math.max(Number(searchParams.get('page') ?? '1') || 1, 1);
  const offset = (page - 1) * limit;

  const client = await getServerClient();
  const { data: blog } = await client
    .from('blogs')
    .select('id, owner_id')
    .eq(blogKey(idOrSlug), idOrSlug)
    .maybeSingle();
  if (!blog) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

  const blogRow = blog as { id: string; owner_id: string };

  const { data: follows, count } = await client
    .from('blog_follows')
    .select('user_id, created_at', { count: 'exact' })
    .eq('blog_id', blogRow.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const followRows = (follows ?? []) as Array<{ user_id: string; created_at: string }>;
  const ids = Array.from(new Set([blogRow.owner_id, ...followRows.map((f) => f.user_id)]));

  const { data: profiles } = ids.length
    ? await client.from('profiles').select('id,username,first_name,last_name,avatar_url').in('id', ids)
    : { data: [] as ProfileRow[] };
  const map = new Map<string, ProfileRow>();
  for (const p of (profiles ?? []) as ProfileRow[]) map.set(p.id, p);

  const toAuthor = (id: string, followedAt?: string) => {
    const p = map.get(id);
    return {
      id,
      name: [p?.first_name, p?.last_name].filter(Boolean).join(' ') || (p?.username ?? 'Usuario'),
      username: p?.username ?? '',
      // Renders as a small circle in the follower list — ship the `avatar`
      // variant, not the ~60-115 KB `/public` original stored in the column.
      avatar: p?.avatar_url ? withImageVariant(p.avatar_url, 'avatar') : null,
      followedAt: followedAt ?? null,
    };
  };

  const total = count ?? followRows.length;
  // NOTE: deliberately NOT CDN-cacheable. `blogs`/`blog_follows` are world-readable,
  // but the `profiles` join is not: its RLS is
  // `profile_visibility = 'public' OR id = auth.uid() OR (friends AND are_friends(...))`,
  // so a friend of a follower sees their real name where a stranger sees the
  // 'Usuario' fallback. A shared cache would leak friends-only names.
  return NextResponse.json({
    owner: toAuthor(blogRow.owner_id),
    followers: followRows.map((f) => toAuthor(f.user_id, f.created_at)),
    total,
    page,
    limit,
    hasMore: offset + followRows.length < total,
  });
}
