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
  url: string;
  thumbnail?: string;
  size?: number;
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
  lastMessage: LastMessage | null;
  unreadCount: number;
  lastReadAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Campos de encriptación
  isEncrypted?: boolean;
  encryptionEnabledAt?: Date | null;
}

// DTOs para encriptación
export interface EnableEncryptionDto {
  password: string;
  encryptExistingMessages?: boolean;
}

export interface DisableEncryptionDto {
  password: string;
}

export interface EncryptionResult {
  conversationId: string;
  encryptionEnabled: boolean;
  encryptedMessagesCount?: number;
  decryptedMessagesCount?: number;
  message: string;
}

// DTOs para requests
export interface CreateConversationDto {
  participantId: string;
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
