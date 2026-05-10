// DTOs - Data Transfer Objects para el módulo de autenticación

import type { OccupationSlug } from '../constants/occupations';

export interface LoginDTO {
  email?: string;
  username?: string;
  password: string;
  captchaToken?: string;
}

export interface ResendOtpRequest {
  email: string;
  captchaToken?: string;
}
export interface MessageResponse {
  message: string;
}
export interface VerifyEmailRequest {
  email: string;
  otp: string;
}


export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  secondName?: string;
  lastName: string;
  secondLastName?: string;
  birthDate: string; // Formato "YYYY-MM-DD"
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  country: string;
  state: string;
  city: string;
  occupation: OccupationSlug;
  acceptedTerms: boolean;
  captchaToken?: string;
}

/**
 * Usuario autenticado - respuesta del backend
 */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  emailVerified: boolean;
  profileCompleted: boolean;
  avatarUrl?: string; // Actualizado para coincidir con el backend
  avatar?: string; // Deprecated: mantener por compatibilidad temporal
  coverPhotoUrl?: string; // Agregado
  createdAt: string;
  lastLoginAt: string;
  firstName?: string;
  secondName?: string;
  lastName?: string;
  secondLastName?: string;
  birthDay?: string;
  birthMonth?: string;
  birthYear?: string;
  gender?: string;
  residenceCountry?: string;
  residenceState?: string;
  residenceCity?: string;
}

/**
 * Respuesta del login/register - nueva estructura del backend
 */
export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ValidateSessionDTO {
  token: string;
}
