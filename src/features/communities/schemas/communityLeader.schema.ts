import { z } from 'zod';
import { aboutInputSchema } from './communityAbout.schema';
import { planCursorSchema } from './communityPlan.schema';

export const leaderScopeSchema = z.object({ communityId: z.uuid(), sectionId: z.uuid() });
const recordSchema = z.object({
  communityId: z.uuid(), id: z.uuid(), expectedVersion: z.number().int().min(1).max(2147483646).optional(),
});
export const leaderCategorySchema = recordSchema.extend({
  sectionId: z.uuid(), title: z.string().trim().min(1).max(120),
  position: z.number().int().min(0).max(2147483647).default(0), isPublished: z.boolean().default(false),
});
export const leaderInputSchema = recordSchema.extend({
  sectionId: z.uuid(), categoryId: z.uuid().nullable().default(null),
  fullName: z.string().trim().min(1).max(160), responsibility: z.string().trim().max(200).default(''),
  biography: aboutInputSchema.shape.description, trajectory: aboutInputSchema.shape.history,
  position: z.number().int().min(0).max(2147483647).default(0), isPublished: z.boolean().default(false),
});
export const leaderContactsSchema = recordSchema.extend({
  email: aboutInputSchema.shape.contactEmail, phone: aboutInputSchema.shape.contactPhone,
  socialLinks: aboutInputSchema.shape.socialLinks, profileUsername: z.string().trim().max(100).default(''),
  isPublic: z.boolean().default(false),
});
export const leaderMediaSchema = recordSchema.extend({
  leaderId: z.uuid(), slot: z.enum(['portrait', 'cover', 'video']), assetId: z.uuid(),
});
export const leaderDeleteSchema = recordSchema.extend({
  expectedVersion: z.number().int().min(1).max(2147483646), confirmed: z.literal(true),
});
export const leaderQuerySchema = leaderScopeSchema.extend({
  categoryId: z.uuid().nullable().optional(), cursor: planCursorSchema.nullable().default(null),
});
