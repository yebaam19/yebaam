import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken, getServiceClient } from '@/utils/supabase/server';
import { imageUrl } from '@/lib/media/urls';
import { chatCryptoReady } from '@/lib/server/chat-crypto';
import { groupAutoName } from '@/features/chat/lib/groupName';

type ConversationRow = {
  id: string;
  type: string;
  name: string | null;
  avatar: string | null;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

async function getUserId(): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return data?.user?.id ?? null;
}

/**
 * Create a multi-person ("group") Messenger conversation.
 *
 * Reuses the existing `conversations` (type='group') + `conversation_participants`
 * model — the DB INSERT is the source of truth and Realtime broadcasts messages
 * for free (see `subscribeToTable`). Creation goes through the service-role
 * client (same precedent as `POST /api/conversations` and `ensureClubPublicChat`)
 * because RLS only lets the conversation *creator* add participants and we add a
 * whole batch at once.
 *
 * SECURITY: the service client bypasses RLS, so we MUST validate authorization
 * here — every `participantId` has to be an accepted friend of the caller.
 * Otherwise this is a forced-group spam vector (drop strangers into a group that
 * lands in their inbox). "The UI only offers friends" is not enforcement.
 */
export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    participantIds?: unknown;
    name?: unknown;
    avatarCfImageId?: unknown;
  };

  const rawIds = Array.isArray(body.participantIds) ? body.participantIds : [];
  const participantIds = Array.from(
    new Set(rawIds.filter((id): id is string => typeof id === 'string' && id.length > 0 && id !== userId)),
  );
  if (participantIds.length < 2) {
    return NextResponse.json(
      { error: 'A group needs at least 2 other members' },
      { status: 400 },
    );
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const avatarCfImageId =
    typeof body.avatarCfImageId === 'string' && body.avatarCfImageId.length > 0
      ? body.avatarCfImageId
      : null;

  const db = getServiceClient();

  // Authorization: every member must be an accepted friend of the caller.
  const { data: friendRows, error: friendErr } = await db
    .from('friendships')
    .select('requester_id,recipient_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

  if (friendErr) {
    return NextResponse.json({ error: friendErr.message }, { status: 500 });
  }

  const friendIds = new Set<string>();
  for (const r of (friendRows ?? []) as { requester_id: string; recipient_id: string }[]) {
    friendIds.add(r.requester_id === userId ? r.recipient_id : r.requester_id);
  }
  const notFriends = participantIds.filter((id) => !friendIds.has(id));
  if (notFriends.length > 0) {
    return NextResponse.json(
      { error: 'You can only add friends to a group' },
      { status: 403 },
    );
  }

  // Create the conversation. Store the Cloudflare image id (never the URL) in
  // metadata; leave `name` NULL when auto-named so the display name stays
  // per-viewer and never goes stale.
  const { data: created, error: createErr } = await db
    .from('conversations')
    .insert({
      type: 'group',
      created_by: userId,
      name: name || null,
      metadata: avatarCfImageId ? { avatar_cf_image_id: avatarCfImageId } : {},
    })
    .select('*')
    .maybeSingle();

  if (createErr || !created) {
    return NextResponse.json(
      { error: createErr?.message ?? 'Failed to create group' },
      { status: 500 },
    );
  }
  const conv = created as ConversationRow;

  const { error: partErr } = await db
    .from('conversation_participants')
    .upsert(
      [userId, ...participantIds].map((user_id) => ({ conversation_id: conv.id, user_id })),
      { onConflict: 'conversation_id,user_id', ignoreDuplicates: true },
    );

  if (partErr) {
    return NextResponse.json({ error: partErr.message }, { status: 500 });
  }

  // Per-viewer display name for the immediate response (the caller). Stored name
  // stays NULL; the GET endpoint recomputes this for each viewer on reload.
  let responseName = name || null;
  if (!responseName) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id,first_name')
      .in('id', participantIds);
    responseName = groupAutoName(
      ((profiles ?? []) as { id: string; first_name: string | null }[]).map(
        (p) => p.first_name ?? '',
      ),
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: conv.id,
      type: conv.type,
      name: responseName,
      avatar: avatarCfImageId ? imageUrl(avatarCfImageId) : null,
      clubId: null,
      participantIds: [userId, ...participantIds],
      lastMessage: null,
      unreadCount: 0,
      lastReadAt: null,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      // Group "salitas" are private conversations → encrypted-by-policy.
      isEncrypted: chatCryptoReady(),
      encryptionEnabledAt: null,
    },
  });
}
