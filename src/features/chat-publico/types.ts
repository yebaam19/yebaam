export interface PublicChatTopic {
  id: string
  slug: string
  name: string
  description: string | null
  position: number
  is_archived: boolean
}

export interface PublicMessageRow {
  id: string
  sender_id: string
  content: string
  created_at: string
  is_deleted: boolean
  topic_id: string
}

export interface PublicMessageSender {
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

export interface PublicMessageWithSender extends PublicMessageRow {
  sender: PublicMessageSender | null
}

export type SendPublicMessageResult =
  | { ok: true }
  | { ok: false; error: 'invalid' | 'unauthorized' | 'rate_limited' | 'db_error'; retryAfterMs?: number; message?: string }

export type SoftDeletePublicMessageResult =
  | { ok: true }
  | { ok: false; error: 'unauthorized' | 'forbidden' | 'db_error'; message?: string }
