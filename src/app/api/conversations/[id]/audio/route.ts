import { NextResponse, type NextRequest } from 'next/server';
import { getPublicAudioUrl } from '@/lib/cloudflare/r2';
import { authorizeChatAttachment } from '@/lib/server/chat-attachment-access';

/**
 * Presign a playback URL for a chat voice note, but ONLY for participants of the
 * conversation (unlike music, which is public). Membership is checked against
 * conversation_participants before signing.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: conversationId } = await context.params;
  let r2Key = '';
  try {
    const body = (await request.json()) as { r2_key?: string } | null;
    r2Key = body?.r2_key ?? '';
  } catch {
    /* validated below */
  }
  const denial = await authorizeChatAttachment(conversationId, r2Key, 'audio');
  if (denial) return NextResponse.json({ error: denial.error }, { status: denial.status });

  try {
    const url = await getPublicAudioUrl(r2Key, 3600);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not sign playback URL' },
      { status: 500 },
    );
  }
}
