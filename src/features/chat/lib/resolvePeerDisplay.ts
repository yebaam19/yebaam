export interface PeerProfileRow {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface PeerDisplay {
  name: string;
  avatar: string | null;
}

/**
 * Resolve a peer's display name + avatar from their `profiles` row, mirroring
 * the fallback chain used in ChatPageClient: full name → @username → UUID slice.
 */
export function resolvePeerDisplay(
  profile: PeerProfileRow | null | undefined,
  peerUserId: string,
): PeerDisplay {
  if (!profile) {
    return { name: peerUserId.slice(0, 8), avatar: null };
  }
  const full = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
  const name = full || (profile.username ? `@${profile.username}` : peerUserId.slice(0, 8));
  return { name, avatar: profile.avatar_url || null };
}
