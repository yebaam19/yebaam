import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();

  let businessId: string | null = null;
  if (UUID_RE.test(idOrSlug)) {
    businessId = idOrSlug;
  } else {
    const { data } = await client.database
      .from('businesses')
      .select('id')
      .eq('slug', idOrSlug)
      .maybeSingle();
    businessId = (data as { id: string } | null)?.id ?? null;
  }
  if (!businessId) return NextResponse.json({ count: 0 });

  const { count } = await client.database
    .from('business_media')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId);

  return NextResponse.json({ count: count ?? 0 });
}
