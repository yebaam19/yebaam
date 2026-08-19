/**
 * Profile Validation Schemas
 *
 * Esquemas de validación con Zod para los formularios de perfil
 */

import { z } from 'zod'
import { isSafeExternalUrl } from '@/lib/safe-href'

/**
 * Schema para actualizar nombres y apellidos del usuario
 */
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(50, 'Máximo 50 caracteres'),
  secondName: z.string().max(50, 'Máximo 50 caracteres').optional(),
  lastName: z.string().min(1, 'El apellido es requerido').max(50, 'Máximo 50 caracteres'),
  secondLastName: z.string().max(50, 'Máximo 50 caracteres').optional(),
})

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>

/**
 * Schema para actualizar información personal
 */
export const updatePersonalInfoSchema = z.object({
  bio: z.string().max(500, 'La biografía no puede exceder 500 caracteres').optional(),
  residenceCountry: z.string().optional(),
  residenceCountryId: z.string().optional(),
  residenceState: z.string().optional(),
  residenceStateId: z.string().optional(),
  residenceCity: z.string().optional(),
  residenceCityId: z.string().optional(),
  birthCountry: z.string().optional(),
  birthCountryId: z.string().optional(),
  birthState: z.string().optional(),
  birthStateId: z.string().optional(),
  birthCity: z.string().optional(),
  birthCityId: z.string().optional(),
  birthdate: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodType: z.string().optional(),
  relationshipStatus: z.enum(['SINGLE', 'IN_RELATIONSHIP', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  phone: z.string().max(20, 'Máximo 20 caracteres').optional(),
})

export type UpdatePersonalInfoValues = z.infer<typeof updatePersonalInfoSchema>

/**
 * URL externa opcional: `z.string().url()` acepta `javascript:` y otros esquemas,
 * así que se exige http(s) explícitamente (stored-XSS via <a href>).
 */
const optionalHttpUrl = z
  .string()
  .url('URL inválida')
  .refine(isSafeExternalUrl, 'URL inválida')
  .optional()
  .or(z.literal(''))

/**
 * Schema para actualizar enlaces sociales
 */
export const updateSocialLinksSchema = z.object({
  websiteUrl: optionalHttpUrl,
  facebookUrl: optionalHttpUrl,
  instagramUrl: optionalHttpUrl,
  twitterUrl: optionalHttpUrl,
  linkedinUrl: optionalHttpUrl,
  githubUrl: optionalHttpUrl,
})

export type UpdateSocialLinksValues = z.infer<typeof updateSocialLinksSchema>

/**
 * Schema para actualizar intereses
 */
export const updateInterestsSchema = z.object({
  interests: z.array(z.string()).max(10, 'Máximo 10 intereses'),
})

export type UpdateInterestsValues = z.infer<typeof updateInterestsSchema>
