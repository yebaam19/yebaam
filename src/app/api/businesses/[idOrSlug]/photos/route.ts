import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import type { BusinessMediaRow } from '@/lib/api/businesses';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveBusinessId(
  client: Awaited<ReturnType<typeof getServerClient>>,
  idOrSlug: string
): Promise<string | null> {
  if (UUID_RE.test(idOrSlug)) return idOrSlug;
  const { data } = await client
    .from('businesses')
    .select('id')
    .eq('slug', idOrSlug)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

function mapMedia(row: BusinessMediaRow) {
  return {
    id: row.id,
    businessId: row.business_id,
    type: row.type,
    url: row.url,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    caption: row.caption ?? undefined,
    alt: row.alt ?? undefined,
    order: row.sort_order ?? 0,
    createdAt: row.created_at,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const businessId = await resolveBusinessId(client, idOrSlug);
  if (!businessId) return NextResponse.json([], { status: 404 });

  const { data, error } = await client
    .from('business_media')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(((data ?? []) as BusinessMediaRow[]).map(mapMedia));
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    url?: string;
    type?: string;
    caption?: string;
    alt?: string;
    thumbnailUrl?: string;
    aspectRatio?: string;
    size?: number;
    mimeType?: string;
  };

  if (!body.url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

  const client = await getServerClient();
  const businessId = await resolveBusinessId(client, idOrSlug);
  if (!businessId) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { data, error } = await client
    .from('business_media')
    .insert({
      business_id: businessId,
      type: (body.type ?? 'IMAGE').toUpperCase(),
      url: body.url,
      thumbnail_url: body.thumbnailUrl ?? null,
      caption: body.caption ?? null,
      alt: body.alt ?? null,
      aspect_ratio: body.aspectRatio ?? null,
      size_bytes: body.size ?? null,
      mime_type: body.mimeType ?? null,
    })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to save photo' },
      { status: 500 }
    );
  }

  return NextResponse.json(mapMedia(data as BusinessMediaRow));
}
