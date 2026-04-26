import { z } from 'zod';

const trimmedString = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, 'Campo requerido')
    .max(max, `Máximo ${max} caracteres`);

export const requiredInfoSchema = z.object({
  firstName: trimmedString(1, 60),
  lastName: trimmedString(1, 60),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  birthPlace: trimmedString(2, 120),
  residenceCountry: trimmedString(2, 80),
  residenceState: trimmedString(1, 80),
  residenceCity: trimmedString(1, 80),
  studyPlace: trimmedString(2, 200),
  workPlace: trimmedString(2, 200),
});
export type RequiredInfoInput = z.infer<typeof requiredInfoSchema>;

export const savePhotoSlotSchema = z.object({
  slot: z.number().int().min(1).max(5),
  cfImageId: z.string().min(1),
});

export const saveIdDocumentSchema = z.object({
  cfImageId: z.string().min(1),
  mimeType: z.string().max(120).optional().nullable(),
});

export const adminReviewSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().max(2000).optional().nullable(),
  rejectionReason: z.string().max(500).optional().nullable(),
});
