import { z } from 'zod';

export const showcaseSchema = z.object({
  communityId: z.uuid(),
  expectedVersion: z.number().int().min(0).max(2147483647),
  introduction: z.string().trim().max(1200).default(''),
  isPublished: z.boolean().default(false),
  videoAssetIds: z.array(z.uuid()).max(4).default([])
    .refine((ids) => new Set(ids).size === ids.length, 'Cada video puede aparecer una sola vez.'),
});
