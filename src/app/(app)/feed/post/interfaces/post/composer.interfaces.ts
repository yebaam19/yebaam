/**
 * Tipos de enriquecimiento del post usados por el compositor
 * (sentimiento/actividad, ubicación y privacidad)
 */

import type { FeelingType } from './enums.interfaces';

/**
 * Sentimiento o actividad en un post
 */
export interface PostFeeling {
  type: FeelingType;
  label: string; // "feliz", "comiendo pizza", etc.
  emoji?: string;
  activity?: string; // Para actividades: "pizza", "Rock", etc.
  prefix?: string; // "se siente", "está", etc.
}

/**
 * Ubicación geográfica
 */
export interface PostLocation {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId?: string; // ID de Google Places o similar
}

/**
 * Privacidad del post
 */
export interface PostPrivacy {
  value: 'public' | 'friends' | 'private' | 'custom';
  allowedUsers?: string[];
}
