/**
 * Interfaces para las estadísticas de un post
 */

import { ReactionType } from './post.interfaces';

/**
 * Usuario que reaccionó a un post
 */
export interface ReactionUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  reactedAt: string; // ISO 8601 date string
}

/**
 * Reacción con lista de usuarios
 */
export interface ReactionWithUsers {
  type: ReactionType;
  count: number;
  users: ReactionUser[];
}

/**
 * Reacción del usuario actual
 */
export interface CurrentUserReaction {
  type: ReactionType;
  reactedAt: string;
}

/**
 * Estadísticas de reacciones
 */
export interface ReactionStatistics {
  total: number;
  counts: Record<ReactionType, number>;
  topReactions: ReactionWithUsers[];
  currentUserReaction: CurrentUserReaction | null;
}

/**
 * Estadísticas de comentarios (placeholder)
 */
export interface CommentStatistics {
  total: number;
  recent: any[]; // TODO: definir interface de Comment
}

/**
 * Estadísticas de compartidos (placeholder)
 */
export interface ShareStatistics {
  total: number;
}

/**
 * Estadísticas de vistas (placeholder)
 */
export interface ViewStatistics {
  total: number;
  unique: number;
}

/**
 * Estadísticas completas de un post
 */
export interface PostStatistics {
  postId: string;
  statistics: {
    reactions: ReactionStatistics;
    comments?: CommentStatistics;
    shares?: ShareStatistics;
    views?: ViewStatistics;
  };
}

/**
 * Respuesta del backend para estadísticas
 */
export interface PostStatisticsResponse extends PostStatistics {}
