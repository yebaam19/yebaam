import { z } from 'zod';

export const institutionalUrlSchema = z.string().trim().max(2000).refine((value) => {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
});
const richText = z.string().max(50000).default('').refine((value) => new TextEncoder().encode(value).byteLength <= 50000);
export const aboutInputSchema = z.object({
  communityId: z.uuid(), id: z.uuid(), expectedVersion: z.number().int().min(1).max(2147483646).optional(),
  description: richText, history: richText, mission: richText, vision: richText, objectives: richText, values: richText,
  foundedOn: z.iso.date().nullable().default(null), location: z.string().trim().max(200).default(''),
  contactEmail: z.union([z.email().max(254), z.literal('')]).default(''),
  contactPhone: z.string().trim().max(40).regex(/^[+\d\s().-]*$/).default(''),
  website: z.union([institutionalUrlSchema, z.literal('')]).default(''),
  socialLinks: z.array(z.object({ label: z.string().trim().min(1).max(80), url: institutionalUrlSchema })).max(10).default([]),
  isPublished: z.boolean().default(false),
});
export const aboutMediaInputSchema = z.object({ communityId: z.uuid(), aboutId: z.uuid(), assetId: z.uuid(), id: z.uuid() });
