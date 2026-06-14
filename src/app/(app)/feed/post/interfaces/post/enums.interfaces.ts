/**
 * Enums base para el módulo de Posts
 *
 * Tipos de contenido, visibilidad, reacciones y sentimientos/actividades.
 * Son valores en runtime (enums), por lo que se exportan como valores.
 */

/**
 * Tipo de contenido de un post
 */
export enum PostType {
  TEXT = 'TEXT',           // Solo texto
  IMAGE = 'IMAGE',         // Texto + Imágenes
  VIDEO = 'VIDEO',         // Texto + Video
  LINK = 'LINK',           // Texto + Link preview
  POLL = 'POLL',           // Encuesta
  SHARED = 'SHARED',       // Post compartido
}

/**
 * Visibilidad de un post
 */
export enum PostVisibility {
  PUBLIC = 'PUBLIC',       // Todos pueden ver
  FRIENDS = 'FRIENDS',     // Solo amigos
  PRIVATE = 'PRIVATE',     // Solo yo
  CUSTOM = 'CUSTOM',       // Lista personalizada
}

/**
 * Tipo de reacción a un post
 */
export enum ReactionType {
  LIKE = 'LIKE',           // Me gusta
  LOVE = 'LOVE',           // Me encanta
  HAHA = 'HAHA',           // Me divierte
  WOW = 'WOW',             // Me asombra
  SAD = 'SAD',             // Me entristece
  ANGRY = 'ANGRY',         // Me enoja
}

/**
 * Tipo de sentimiento/actividad
 */
export enum FeelingType {
  // Sentimientos
  HAPPY = 'HAPPY',
  BLESSED = 'BLESSED',
  LOVED = 'LOVED',
  EXCITED = 'EXCITED',
  GRATEFUL = 'GRATEFUL',
  SAD = 'SAD',
  ANGRY = 'ANGRY',
  CONFUSED = 'CONFUSED',
  TIRED = 'TIRED',
  // Actividades
  EATING = 'EATING',
  DRINKING = 'DRINKING',
  TRAVELING = 'TRAVELING',
  WATCHING = 'WATCHING',
  READING = 'READING',
  PLAYING = 'PLAYING',
  LISTENING = 'LISTENING',
  CELEBRATING = 'CELEBRATING',
  WORKING = 'WORKING',
  EXERCISING = 'EXERCISING',
}
