import { z } from 'zod';

export const imageFramingSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  zoom: z.number().min(1).max(3),
}).strict();
export type ImageFraming = z.infer<typeof imageFramingSchema>;
export const DEFAULT_IMAGE_FRAMING: ImageFraming = { x: 50, y: 50, zoom: 1 };
export const headerImageSchema = z.object({
  communityId: z.uuid(), target: z.enum(['cover', 'profile']),
  expectedVersion: z.number().int().min(1).max(2147483647),
  imageId: z.string().regex(/^[A-Za-z0-9_-]{20,64}$/).nullable(),
  framing: imageFramingSchema,
});
export type HeaderImageInput = z.infer<typeof headerImageSchema>;
export type HeaderImages = {
  version: number;
  cover: { id: string | null; framing: ImageFraming };
  profile: { id: string | null; framing: ImageFraming };
};
