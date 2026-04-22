export interface PublicChatTopic {
  id: string
  slug: string
  name: string
  description: string | null
  position: number
  is_archived: boolean
  owner_type: string | null
  owner_id: string | null
  // v2 room fields (nullable when the migration hasn't run yet)
  city_id?: string | null
  parent_topic_id?: string | null
  creator_id?: string | null
  visibility?: 'public' | 'private' | 'secret' | null
  max_capacity?: number | null
  duration_hours?: number | null
  expires_at?: string | null
  last_activity_at?: string | null
  closed_at?: string | null
  is_permanent?: boolean | null
}

export interface PublicMessageRow {
  id: string
  sender_id: string | null
  content: string | null
  created_at: string
  is_deleted: boolean
  topic_id: string
  // v2 fields (nullable)
  sender_kind?: 'profile' | 'nick' | 'guest' | 'system' | null
  sender_nickname?: string | null
  sender_avatar_url?: string | null
  media_url?: string | null
  media_type?: 'image' | 'gif' | 'video' | 'link' | null
  media_meta?: Record<string, unknown> | null
  parent_message_id?: string | null
  reply_count?: number | null
  reaction_count?: number | null
  is_trending?: boolean | null
  trending_at?: string | null
  expires_at?: string | null
}

export type ChatIdentityKind = 'profile' | 'nick' | 'guest'

/** Server-side identity: carries the session_token used for DB writes. NEVER pass to client. */
export type ChatIdentity =
  | {
      kind: 'profile'
      userId: string
      sessionToken: string
      displayName: string
      username: string | null
      avatarUrl: string | null
    }
  | {
      kind: 'nick'
      userId: string
      sessionToken: string
      nickname: string
      avatarUrl: string | null
    }
  | {
      kind: 'guest'
      sessionToken: string
      nickname: string
    }

/** Client-safe identity: no session_token. */
export type ClientChatIdentity =
  | {
      kind: 'profile'
      userId: string
      displayName: string
      username: string | null
      avatarUrl: string | null
    }
  | {
      kind: 'nick'
      userId: string
      nickname: string
      avatarUrl: string | null
    }
  | {
      kind: 'guest'
      nickname: string
    }

export function toClientIdentity(identity: ChatIdentity): ClientChatIdentity {
  if (identity.kind === 'profile') {
    return {
      kind: 'profile',
      userId: identity.userId,
      displayName: identity.displayName,
      username: identity.username,
      avatarUrl: identity.avatarUrl,
    }
  }
  if (identity.kind === 'nick') {
    return {
      kind: 'nick',
      userId: identity.userId,
      nickname: identity.nickname,
      avatarUrl: identity.avatarUrl,
    }
  }
  return { kind: 'guest', nickname: identity.nickname }
}

export interface RoomPresenceRow {
  id: string
  room_id: string
  user_id: string | null
  session_hash: string
  identity_kind: ChatIdentityKind
  display_name: string
  avatar_url: string | null
  joined_at: string
  last_seen_at: string
  is_muted: boolean
}

export type JoinRoomResult =
  | { ok: true; identity: ChatIdentity }
  | { ok: false; error: 'nickname_taken' | 'invalid' | 'unauthorized' | 'room_closed' | 'room_full' | 'db_error'; message?: string }

export interface PublicMessageSender {
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

export interface PublicMessageWithSender extends PublicMessageRow {
  sender: PublicMessageSender | null
}

/** Derived display info so the view doesn't branch on sender_kind everywhere. */
export interface ResolvedMessageAuthor {
  label: string
  avatarUrl: string | null
  kind: ChatIdentityKind
  userId: string | null
}

export type SendPublicMessageResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: 'invalid' | 'unauthorized' | 'rate_limited' | 'db_error'; retryAfterMs?: number; message?: string }

export type SoftDeletePublicMessageResult =
  | { ok: true }
  | { ok: false; error: 'unauthorized' | 'forbidden' | 'db_error'; message?: string }
