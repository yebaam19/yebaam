/**
 * Tipos relacionados con autores y usuarios de un post
 */

/**
 * Usuario etiquetado en el post
 */
export interface TaggedUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

/**
 * Autor de un post (información básica del usuario)
 */
export interface PostAuthor {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isVerified?: boolean;
  _id?: string; // ID de MongoDB
}
