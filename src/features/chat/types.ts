// Tipos que coinciden con los DTOs del backend

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
}

export interface MessageMedia {
  type: MediaType;
  cf_image_id?: string;
  cf_stream_uid?: string;
  /** Cloudflare R2 object key for audio (`chat-audio/…`: voice notes / audio
   *  files) and documents (`chat-files/…`). Exchanged for a presigned URL via
   *  the conversation's membership-checked audio/file routes. */
  r2_key?: string;
  /** Audio duration in seconds. */
  duration?: number;
  /** Base MIME type (e.g. audio/webm, application/pdf), for playback/download hints. */
  mime?: string;
  size?: number;
  /** Original filename — documents use it as the download name. */
  filename?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  media: MessageMedia | null;
  status: MessageStatus;
  replyToId: string | null;
  isDeleted: boolean;
  /** Set when the text was edited — powers the "editado" label. */
  editedAt?: string | Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

export interface LastMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date;
  media?: MessageMedia | null;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  participantIds: string[];
  name: string | null;
  avatar: string | null;
  /**
   * Owning club for club/system group chats. `null` for user-created groups
   * and direct chats. Drives the Messenger sidebar tab split: user groups land
   * in Bandejas, club groups in Comunidades.
   */
  clubId?: string | null;
  lastMessage: LastMessage | null;
  unreadCount: number;
  lastReadAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** Policy-derived: private conversations (direct + salitas) are encrypted
   * at rest once the platform key is configured; club chats are not. */
  isEncrypted?: boolean;
  encryptionEnabledAt?: Date | null;
}

// DTOs para requests
export interface CreateConversationDto {
  participantId: string;
}

export interface CreateGroupConversationDto {
  /** Other members (the caller is added automatically). Must be ≥2 friends. */
  participantIds: string[];
  /** Optional custom name. When omitted, a per-viewer name is derived at read time. */
  name?: string;
  /** Cloudflare Images id (not the URL) for the group photo. */
  avatarCfImageId?: string;
}

export interface CreateMessageDto {
  conversationId: string;
  content?: string; // Ahora opcional porque puede enviar solo media
  media?: MessageMedia; // Agregar soporte para media
  replyToId?: string;
}

export interface MarkMessagesAsReadDto {
  conversationId: string;
}

// Response types
export interface GetMessagesResponse {
  messages: Message[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface GetConversationsResponse {
  conversations: Conversation[];
}

// WebSocket event payloads
export interface MessageReceivedEvent {
  message: Message;
  conversationId: string;
}

export interface MessagesReadEvent {
  conversationId: string;
  userId: string;
}

export interface SendMessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
}

export interface JoinConversationResponse {
  success: boolean;
  conversationId?: string;
  error?: string;
}
