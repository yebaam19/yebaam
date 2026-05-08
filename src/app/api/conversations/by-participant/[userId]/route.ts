import { NextResponse } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { withRetry } from '@/utils/supabase/with-retry';
import { resolvePeerDisplay, type PeerProfileRow } from '@/features/chat/lib/resolvePeerDisplay';

type ConversationRow = {
  id: string;
  type: string;
  name: string | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const token = await getServerAccessToken();
    if (!token) return NextResponse.json({ success: true, data: null });

    const { userId: otherId } = await params;
    if (!otherId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const client = await getServerClient();
    const { data: me, error: meErr } = await client.auth.getUser();
    if (meErr) {
      console.error('[by-participant] auth.getUser failed', meErr);
      return NextResponse.json({ success: true, data: null });
    }
    const meId = me?.user?.id;
    if (!meId) return NextResponse.json({ success: true, data: null });
    if (meId === otherId) {
      return NextResponse.json({ success: true, data: null });
    }

    const { data: myParts, error: myErr } = await withRetry(() =>
      client
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', meId),
    );
    if (myErr) {
      console.error('[by-participant] myParts query failed', myErr);
      return NextResponse.json({ error: myErr.message }, { status: 500 });
    }

    const myIds = ((myParts ?? []) as { conversation_id: string }[])
      .map((r) => r.conversation_id)
      .filter(Boolean);
    if (myIds.length === 0) return NextResponse.json({ success: true, data: null });

    const { data: shared, error: sharedErr } = await withRetry(() =>
      client
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherId)
        .in('conversation_id', myIds),
    );
    if (sharedErr) {
      console.error('[by-participant] shared query failed', sharedErr);
      return NextResponse.json({ error: sharedErr.message }, { status: 500 });
    }

    const sharedIds = ((shared ?? []) as { conversation_id: string }[])
      .map((r) => r.conversation_id)
      .filter(Boolean);
    if (sharedIds.length === 0) return NextResponse.json({ success: true, data: null });

    const { data: conv, error: convErr } = await withRetry(() =>
      client
        .from('conversations')
        .select('id,type,name,avatar,created_at,updated_at,metadata')
        .in('id', sharedIds)
        .eq('type', 'direct')
        .limit(1)
        .maybeSingle(),
    );
    if (convErr) {
      console.error('[by-participant] conv query failed', convErr);
      return NextResponse.json({ error: convErr.message }, { status: 500 });
    }
    if (!conv) return NextResponse.json({ success: true, data: null });

    const row = conv as ConversationRow;
    const meta = row.metadata ?? {};

    // Resolve peer name/avatar — DIRECT conversations have NULL on the row.
    const { data: peerProfile } = await withRetry(() =>
      client
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .eq('id', otherId)
        .maybeSingle(),
    );
    const peerDisplay = resolvePeerDisplay(
      (peerProfile ?? null) as PeerProfileRow | null,
      otherId,
    );

    return NextResponse.json({
      success: true,
      data: {
        id: row.id,
        type: row.type,
        name: row.name ?? peerDisplay.name,
        avatar: row.avatar ?? peerDisplay.avatar,
        participantIds: [meId, otherId],
        lastMessage: null,
        unreadCount: 0,
        lastReadAt: null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        metadata: meta,
        isEncrypted: Boolean((meta as { is_encrypted?: boolean }).is_encrypted),
        encryptionEnabledAt:
          (meta as { encryption_enabled_at?: string }).encryption_enabled_at ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[by-participant] uncaught error', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
