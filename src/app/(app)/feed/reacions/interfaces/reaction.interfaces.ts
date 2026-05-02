/**
 * Tipos de reacción disponibles
 */
export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  HAHA = 'HAHA',
  WOW = 'WOW',
  SAD = 'SAD',
  ANGRY = 'ANGRY',
}

/**
 * Configuración visual de cada tipo de reacción
 */
export interface ReactionConfig {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}

/**
 * Reacción individual
 */
export interface Reaction {
  id: string;
  postId: string;
  commentId?: string;
  userId: string;
  type: ReactionType;
  createdAt: string;
  updatedAt: string;

  // Datos del usuario (populados)
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

/**
 * Contadores de reacciones por tipo
 */
export interface ReactionCounts {
  LIKE: number;
  LOVE: number;
  HAHA: number;
  WOW: number;
  SAD: number;
  ANGRY: number;
}

/**
 * DTO para crear una reacción
 */
export interface CreateReactionDTO {
  postId: string;
  type: ReactionType;
}

/**
 * DTO para actualizar una reacción
 */
export interface UpdateReactionDTO {
  type: ReactionType;
}

/**
 * Respuesta del backend con reacciones
 */
export interface ReactionsResponse {
  reactions: Reaction[];
  counts: ReactionCounts;
  currentUserReaction: Reaction | null;
  total: number;
}

/**
 * Filtros para obtener reacciones
 */
export interface GetReactionsFilters {
  postId?: string;
  userId?: string;
  type?: ReactionType;
  page?: number;
  limit?: number;
}

/**
 * Configuración de emojis para cada reacción
 */
export const REACTION_CONFIGS: Record<ReactionType, ReactionConfig> = {
  [ReactionType.LIKE]: {
    type: ReactionType.LIKE,
    emoji: '👍',
    label: 'Me gusta',
    color: '#0084FF',
  },
  [ReactionType.LOVE]: {
    type: ReactionType.LOVE,
    emoji: '❤️',
    label: 'Me encanta',
    color: '#F33E58',
  },
  [ReactionType.HAHA]: {
    type: ReactionType.HAHA,
    emoji: '😂',
    label: 'Me divierte',
    color: '#F7B125',
  },
  [ReactionType.WOW]: {
    type: ReactionType.WOW,
    emoji: '😮',
    label: 'Me asombra',
    color: '#F7B125',
  },
  [ReactionType.SAD]: {
    type: ReactionType.SAD,
    emoji: '😢',
    label: 'Me entristece',
    color: '#F7B125',
  },
  [ReactionType.ANGRY]: {
    type: ReactionType.ANGRY,
    emoji: '😡',
    label: 'Me enoja',
    color: '#E9710F',
  },
};
