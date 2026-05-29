import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { getPublicAudioUrl } from '@/lib/cloudflare/r2';

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
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  }

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id;
  if (!viewerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let r2Key = '';
  try {
    const body = (await request.json()) as { r2_key?: string } | null;
    r2Key = body?.r2_key ?? '';
  } catch {
    /* validated below */
  }
  if (!r2Key.startsWith('chat-audio/')) {
    return NextResponse.json({ error: 'Invalid audio key' }, { status: 400 });
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
    const url = await getPublicAudioUrl(r2Key, 3600);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not sign playback URL' },
      { status: 500 },
    );
  }
}
