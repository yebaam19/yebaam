import { NextResponse, type NextRequest } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getServerClient } from '@/utils/supabase/server';
import { getR2Client, getR2Bucket } from '@/lib/cloudflare/r2';
import { attachmentDisposition } from '@/lib/http/content-disposition';

/**
 * Presign a download URL for a chat document attachment, but ONLY for
 * participants of the conversation (mirrors the ../audio route). Membership is
 * checked against conversation_participants before signing, and the key is
 * prefix-locked to `chat-files/` so this route can't leak other R2 objects.
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: conversationId } = await context.params;
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  }

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id;
  if (!viewerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let r2Key = '';
  let filename = '';
  try {
    const body = (await request.json()) as { r2_key?: string; filename?: string } | null;
    r2Key = body?.r2_key ?? '';
    filename = typeof body?.filename === 'string' ? body.filename : '';
  } catch {
    /* validated below */
  }
  if (!r2Key.startsWith('chat-files/')) {
    return NextResponse.json({ error: 'Invalid file key' }, { status: 400 });
  }

  const { data: membership, error: memberErr } = await client
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', viewerId)
    .maybeSingle();
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 });
  if (!membership) {
    return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
  }

  try {
    const cmd = new GetObjectCommand({
      Bucket: getR2Bucket(),
      Key: r2Key,
      ...(filename ? { ResponseContentDisposition: attachmentDisposition(filename) } : {}),
    });
    const url = await getSignedUrl(getR2Client(), cmd, { expiresIn: 3600 });
    return NextResponse.json({ url, filename: filename || null });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not sign download URL' },
      { status: 500 },
    );
  }
}
