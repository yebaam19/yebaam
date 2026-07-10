import { NextResponse, type NextRequest, after } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { resolvePage } from '@/lib/api/page-authz';
import { notifyPageOwner } from '@/lib/api/page-notifications';

const REACTION_TYPES = new Set(['recommend', 'like'] as const);
type ReactionType = 'recommend' | 'like';

function parseType(raw: unknown): ReactionType | null {
  if (typeof raw !== 'string') return null;
  return REACTION_TYPES.has(raw as ReactionType) ? (raw as ReactionType) : null;
}

async function refreshCounts(
  client: Awaited<ReturnType<typeof getServerClient>>,
  pageId: string
) {
  // Triggers keep denormalized counters; this returns the live row for the client.
  const { data } = await client
    .from('pages')
    .select('recommend_count,like_count')
    .eq('id', pageId)
    .maybeSingle();
  return {
    recommendCount: (data as { recommend_count?: number } | null)?.recommend_count ?? 0,
    likeCount: (data as { like_count?: number } | null)?.like_count ?? 0,
  };
}

/** POST — add a recommend or like for the authenticated viewer. */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { type?: unknown };
  const type = parseType(body.type);
  if (!type) {
    return NextResponse.json(
      { error: 'type must be "recommend" or "like"' },
      { status: 400 }
    );
  }

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  // Only notify on the FIRST reaction — a repeat POST (double-click, refetch)
  // must not spam the owner. Mirrors the `existing` guard in followers/follow.
  const { data: existing } = await client
    .from('page_reactions')
    .select('page_id')
    .eq('page_id', page.id)
    .eq('user_id', userId)
    .eq('type', type)
    .maybeSingle();

  if (!existing) {
    const { error } = await client.from('page_reactions').upsert(
      { page_id: page.id, user_id: userId, type },
      { onConflict: 'page_id,user_id,type', ignoreDuplicates: true }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    after(async () => {
      await notifyPageOwner({
        pageId: page.id,
        type: type === 'recommend' ? 'page_recommend' : 'page_like',
        actorId: userId,
        message: type === 'recommend' ? 'recomendó tu página' : 'le gustó tu página',
      });
    });
  }

  const counts = await refreshCounts(client, page.id);
  return NextResponse.json({
    success: true,
    type,
    active: true,
    ...counts,
  });
}

/** DELETE — remove the viewer's recommend or like. */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const { searchParams } = new URL(request.url);
  const type = parseType(searchParams.get('type'));
  if (!type) {
    return NextResponse.json(
      { error: 'type must be "recommend" or "like"' },
      { status: 400 }
    );
  }

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const { error } = await client
    .from('page_reactions')
    .delete()
    .eq('page_id', page.id)
    .eq('user_id', userId)
    .eq('type', type);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts = await refreshCounts(client, page.id);
  return NextResponse.json({
    success: true,
    type,
    active: false,
    ...counts,
  });
}
