import { NextResponse, type NextRequest } from 'next/server';
import { getServerAccessToken } from '@/utils/supabase/server';
import { getPresignedUploadUrl } from '@/lib/cloudflare/r2';

// Chat document attachments. Separate from /api/upload/file-url (which gates on
// owning a professional service and mints `cvs/…` PDF-only keys): any
// authenticated user can attach a document to a chat, under the `chat-files/…`
// prefix that the conversation-scoped read route is locked to.
// Keep in sync with CHAT_FILE_MAX_BYTES in src/features/chat/lib/chatR2Upload.ts.
const CHAT_FILE_MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  // Windows browsers report .zip with this legacy mime.
  'application/x-zip-compressed',
]);
const EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
};

export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let contentType = '';
  let size: number | undefined;
  try {
    const body = (await request.json()) as { contentType?: string; size?: number } | null;
    contentType = body?.contentType ?? '';
    if (typeof body?.size === 'number' && Number.isFinite(body.size)) {
      size = Math.floor(body.size);
    }
  } catch {
    /* fall through to validation */
  }
  const base = contentType.split(';')[0].trim().toLowerCase();
  if (!ALLOWED.has(base)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Allowed: pdf, doc(x), xls(x), ppt(x), txt, zip.' },
      { status: 400 },
    );
  }

  // Declared size is required: rejected here before signing AND bound into the
  // signature (ContentLength), so the client cannot PUT a bigger file than it
  // declared (same discipline as the CV upload route).
  if (size === undefined || size <= 0) {
    return NextResponse.json({ error: 'File size is required.' }, { status: 400 });
  }
  if (size > CHAT_FILE_MAX_BYTES) {
    return NextResponse.json(
      { error: `File exceeds the ${Math.round(CHAT_FILE_MAX_BYTES / (1024 * 1024))} MB limit.` },
      { status: 400 },
    );
  }

  const year = new Date().getUTCFullYear();
  const key = `chat-files/${year}/${crypto.randomUUID()}.${EXT[base]}`;
  try {
    const { url } = await getPresignedUploadUrl(key, base, 300, size);
    return NextResponse.json({ url, key, mime: base });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not sign upload URL' },
      { status: 500 },
    );
  }
}
