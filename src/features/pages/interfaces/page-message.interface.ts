/**
 * Tipos de mensaje
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
}

/**
 * Tipo de remitente
 */
export enum SenderType {
  USER = 'user',
  PAGE = 'page',
}

/**
 * Interface para un mensaje individual en una conversación
 */
export interface PageMessage {
  id: string;
  pageId: string;
  senderId: string;
  senderType: SenderType;
  conversationId: string;
  message: string;
  messageType: MessageType;
  mediaUrl: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Metadata opcional (puede venir del backend)
  senderName?: string;
  senderAvatar?: string;
}

/**
 * DTO para enviar un nuevo mensaje
 */
export interface SendMessageDto {
  message: string;
  messageType?: MessageType;
  mediaUrl?: string;
  s3Key?: string;
}

/**
 * Respuesta al obtener mensajes con paginación
 */
export interface GetMessagesResponse {
  messages: PageMessage[];
  total: number;
}

/**
 * Query params para obtener mensajes
 */
export interface GetMessagesQuery {
  page?: number;
  limit?: number;
  before?: string; // ISO date string para infinite scroll
}
