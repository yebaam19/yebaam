import { supabase } from '@/utils/supabase/client';
import { resolvePeerDisplay, type PeerProfileRow } from './resolvePeerDisplay';
import { groupAutoName } from './groupName';

export interface GroupParticipant {
  userId: string;
  name: string;
  avatar: string;
}

/**
 * Resolve every member of a group conversation to a display name + avatar, and
 * derive the per-viewer auto name ("Ana, Luis", excluding the viewer). Shared by
 * the full-page chat and the floating bubble so group sender labels stay
 * consistent. Pass `knownParticipantIds` to skip the membership round-trip when
 * the caller already has it.
 */
export async function fetchGroupParticipants(
  conversationId: string,
  meId: string,
  knownParticipantIds?: string[],
): Promise<{ participants: GroupParticipant[]; autoName: string }> {
  let ids = knownParticipantIds;
  if (!ids) {
    const { data: partRows } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);
    ids = ((partRows ?? []) as { user_id: string }[]).map((r) => r.user_id).filter(Boolean);
  }
  if (ids.length === 0) return { participants: [], autoName: '' };

  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .in('id', ids);
  const profiles = new Map<string, PeerProfileRow>();
  for (const p of (profileRows ?? []) as PeerProfileRow[]) profiles.set(p.id, p);

  const participants: GroupParticipant[] = ids.map((id) => {
    const d = resolvePeerDisplay(profiles.get(id) ?? null, id);
    return { userId: id, name: d.name, avatar: d.avatar ?? '' };
  });
  const autoName = groupAutoName(
    ids.filter((id) => id !== meId).map((id) => profiles.get(id)?.first_name ?? ''),
  );
  return { participants, autoName };
}
