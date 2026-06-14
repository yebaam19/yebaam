export type ParticipantRow = {
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
};

export type ConversationRow = {
  id: string;
  type: string;
  name: string | null;
  avatar: string | null;
  created_by: string | null;
  club_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media: unknown;
  created_at: string;
};
