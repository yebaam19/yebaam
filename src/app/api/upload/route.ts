import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';

const ALLOWED_BUCKETS = new Set([
  'avatars',
  'covers',
  'posts',
  'profile-photos',
  'profile-videos',
  'stories',
]);

const MAX_FILE_BYTES = 100 * 1024 * 1024;

function sanitizeFileName(name: string): string {
  const base = name.replace(/[^\w.\-]+/g, '_');
  return base.length > 120 ? base.slice(-120) : base;
}

export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const bucket = String(form.get('bucket') ?? '');
  const folder = String(form.get('folder') ?? '');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 });
  }

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Storage RLS requires the first path segment to be the caller's UUID.
  // Any optional sub-folder hangs off underneath the user's prefix.
  const safeFolder = folder.replace(/[^\w\-/]+/g, '_').replace(/^\/+|\/+$/g, '');
  const fileName = `${Date.now()}-${sanitizeFileName(file.name || 'upload')}`;
  const prefix = safeFolder ? `${userId}/${safeFolder}` : userId;
  const key = `${prefix}/${fileName}`;

  const { error } = await client.storage.from(bucket).upload(key, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Supabase getPublicUrl is synchronous and returns { data: { publicUrl } }.
  const { data: publicData } = client.storage.from(bucket).getPublicUrl(key);

  return NextResponse.json({
    success: true,
    data: {
      url: publicData.publicUrl,
      key,
      bucket,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    },
  });
}
