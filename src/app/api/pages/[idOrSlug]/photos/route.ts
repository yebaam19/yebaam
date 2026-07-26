import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { withImageVariant } from '@/lib/media/urls';
import { resolvePage } from '@/lib/api/page-authz';
import { canManagePage } from '@/lib/api/page-team';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PhotoRow = {
  id: string;
  page_id: string;
  uploaded_by: string;
  url: string;
  s3_key: string | null;
  caption: string | null;
  aspect_ratio: string;
  size_bytes: number | null;
  mime_type: string | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string;
  updated_at: string;
};

type ProfileLite = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

async function resolvePageId(
  client: Awaited<ReturnType<typeof getServerClient>>,
  idOrSlug: string
): Promise<string | null> {
  if (UUID_RE.test(idOrSlug)) return idOrSlug;
  const { data } = await client
    .from('pages')
    .select('id')
    .eq('slug', idOrSlug)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

function mapPhoto(row: PhotoRow, uploader?: ProfileLite) {
  return {
    id: row.id,
    pageId: row.page_id,
    uploadedBy: {
      id: row.uploaded_by,
      username: uploader?.username ?? '',
      firstName: uploader?.first_name ?? '',
      lastName: uploader?.last_name ?? '',
      // Uploader chip is small; `row.url` below is the photo itself and stays
      // at its stored variant.
      avatar: uploader?.avatar_url
        ? withImageVariant(uploader.avatar_url, 'avatar')
        : undefined,
    },
    url: row.url,
    s3Key: row.s3_key ?? '',
    caption: row.caption ?? undefined,
    aspectRatio: row.aspect_ratio as 'vertical' | 'horizontal' | 'square',
    size: row.size_bytes ?? 0,
    mimeType: row.mime_type ?? '',
    likesCount: row.likes_count ?? 0,
    commentsCount: row.comments_count ?? 0,
    uploadedAt: row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const pageId = await resolvePageId(client, idOrSlug);
  if (!pageId) return NextResponse.json([], { status: 404 });

  const { data, error } = await client
    .from('page_photos')
    .select('*')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as PhotoRow[];
  const uploaderIds = Array.from(new Set(rows.map((r) => r.uploaded_by).filter(Boolean)));
  const { data: profiles } = uploaderIds.length
    ? await client
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .in('id', uploaderIds)
    : { data: [] as ProfileLite[] };

  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);

  return NextResponse.json(rows.map((r) => mapPhoto(r, profileMap.get(r.uploaded_by))));
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    url?: string;
    s3Key?: string;
    caption?: string;
    aspectRatio?: 'vertical' | 'horizontal' | 'square';
    size?: number;
    mimeType?: string;
  };
  if (!body.url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // `resolvePage` (not `resolvePageId`) does a real lookup under RLS, so a page
  // the caller may not see resolves to null rather than being accepted on the
  // strength of the uuid alone. Then the same canManagePage gate every sibling
  // page-content writer uses — articles:115, artists:97, events:125,
  // auditions:122, video-embeds:108. This route was the one that skipped it,
  // which let a non-member insert gallery rows into another page.
  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  if (!(await canManagePage(client, page.id, userId, page.ownerId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await client
    .from('page_photos')
    .insert({
      page_id: page.id,
      uploaded_by: userId,
      url: body.url,
      s3_key: body.s3Key ?? null,
      caption: body.caption ?? null,
      aspect_ratio: body.aspectRatio ?? 'square',
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

  const { data: profile } = await client
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return NextResponse.json(mapPhoto(data as PhotoRow, (profile ?? undefined) as ProfileLite | undefined));
}
