import { z } from 'zod';

export const petSexSchema = z.enum(['male', 'female', 'unknown']);
export const petPrivacySchema = z.enum(['public', 'friends', 'private']);

const optionalTrimmed = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));

export const createPetSchema = z.object({
  name: z.string().trim().min(1).max(80),
  species: z.string().trim().min(1).max(60),
  breed: optionalTrimmed,
  sex: petSexSchema.optional().default('unknown'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  color: optionalTrimmed,
  weightKg: z
    .number()
    .nonnegative()
    .max(9999)
    .optional()
    .nullable(),
  microchipId: optionalTrimmed,
  isVaccinated: z.boolean().optional().default(false),
  isSterilized: z.boolean().optional().default(false),
  allergies: z.string().trim().max(2000).optional().nullable(),
  vetContact: z.string().trim().max(500).optional().nullable(),
  about: z.string().trim().max(4000).optional().nullable(),
  coverCfImageId: z.string().trim().min(1).optional().nullable(),
  privacy: petPrivacySchema.optional().default('public'),
});

export const updatePetSchema = createPetSchema.partial().extend({
  id: z.string().uuid(),
});

export const addPetPhotoSchema = z.object({
  petId: z.string().uuid(),
  cfImageId: z.string().trim().min(1),
  caption: z.string().trim().max(500).optional().nullable(),
});

export const addPetVideoSchema = z.object({
  petId: z.string().uuid(),
  cfStreamUid: z.string().trim().min(1),
  thumbnailCfImageId: z.string().trim().min(1).optional().nullable(),
  caption: z.string().trim().max(500).optional().nullable(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
export type AddPetPhotoInput = z.infer<typeof addPetPhotoSchema>;
export type AddPetVideoInput = z.infer<typeof addPetVideoSchema>;
