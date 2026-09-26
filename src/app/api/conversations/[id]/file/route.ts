import { NextResponse, type NextRequest } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client, getR2Bucket } from '@/lib/cloudflare/r2';
import { attachmentDisposition } from '@/lib/http/content-disposition';
import { authorizeChatAttachment } from '@/lib/server/chat-attachment-access';

/**
 * Presign a download URL for a chat document attachment, but ONLY for
 * participants of the conversation (mirrors the ../audio route). Membership is
 * checked against conversation_participants before signing. The key must also
 * belong to a live file message in this conversation.
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: conversationId } = await context.params;
  let r2Key = '';
  let filename = '';
  try {
    const body = (await request.json()) as { r2_key?: string; filename?: string } | null;
    r2Key = body?.r2_key ?? '';
    filename = typeof body?.filename === 'string' ? body.filename : '';
  } catch {
    /* validated below */
  }
  const denial = await authorizeChatAttachment(conversationId, r2Key, 'file');
  if (denial) return NextResponse.json({ error: denial.error }, { status: denial.status });

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
