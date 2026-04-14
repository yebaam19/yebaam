import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();

  let pageId: string | null = null;
  if (UUID_RE.test(idOrSlug)) {
    pageId = idOrSlug;
  } else {
    const { data } = await client
      .from('pages')
      .select('id')
      .eq('slug', idOrSlug)
      .maybeSingle();
    pageId = (data as { id: string } | null)?.id ?? null;
  }
  if (!pageId) return NextResponse.json({ count: 0 });

  const { count } = await client
    .from('page_photos')
    .select('id', { count: 'exact', head: true })
    .eq('page_id', pageId);

  return NextResponse.json({ count: count ?? 0 });
}
