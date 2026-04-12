/**
 * Metadata de la página en la conversación
 */
export interface PageMetadata {
  pageName?: string;
  pageAvatar?: string;
}

/**
 * Metadata del usuario en la conversación
 */
export interface UserMetadata {
  userName?: string;
  userAvatar?: string;
}

/**
 * Interface para una conversación entre usuario y página
 */
export interface PageConversation {
  id: string;
  pageId: string;
  userId: string;
  lastMessage: string;
  lastMessageAt: Date;
  lastMessageSenderId: string | null;
  unreadCount: number;
  isArchivedByPage: boolean;
  isArchivedByUser: boolean;
  isBlockedByPage: boolean;
  isBlockedByUser: boolean;
  pageMetadata: PageMetadata;
  userMetadata: UserMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Respuesta al obtener conversaciones con paginación
 */
export interface GetConversationsResponse {
  conversations: PageConversation[];
  total: number;
}

/**
 * Query params para obtener conversaciones
 */
export interface GetConversationsQuery {
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}
