/**
 * Tipos e Interfaces para el módulo de Posts
 *
 * Define la estructura de datos de publicaciones,
 * DTOs para crear/actualizar posts, y tipos auxiliares.
 *
 * Este archivo es un BARREL: las declaraciones viven en sub-módulos
 * cohesivos bajo `./post/` y se re-exportan aquí para preservar todos
 * los specifiers de importación existentes sin cambios en los consumidores.
 */

// Enums (valores en runtime)
export { PostType, PostVisibility, ReactionType, FeelingType } from './post/enums.interfaces';

// Autores / usuarios
export type { TaggedUser, PostAuthor } from './post/author.interfaces';

// Multimedia
export type { PostGif, MediaFile } from './post/media.interfaces';

// Reacciones
export type { ReactionsCount } from './post/reactions.interfaces';

// Enriquecimiento del compositor (sentimiento, ubicación, privacidad)
export type { PostFeeling, PostLocation, PostPrivacy } from './post/composer.interfaces';

// Post principal y listado/feed
export type { Post, PostsResponse, GetPostsFilters } from './post/post.interfaces';

// DTOs
export type {
  CreatePostDTO,
  UpdatePostDTO,
  CreateReactionDTO,
  CreateCommentDTO,
} from './post/dto.interfaces';
