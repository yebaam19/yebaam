import { z } from 'zod';
import { isValidWebsite } from '@/lib/safe-href';
const optionalUrl = z.string().trim().max(2000).refine(isValidWebsite).default('');
export const eventSchema = z.object({
  id: z.uuid(), communityId: z.uuid(), expectedVersion: z.number().int().min(0),
  title: z.string().trim().min(1).max(180), description: z.string().trim().max(10000).default(''),
  startsAt: z.iso.datetime({ offset: true }), endsAt: z.iso.datetime({ offset: true }),
  location: z.string().trim().max(500).default(''), virtualUrl: optionalUrl,
  organizer: z.string().trim().min(1).max(180), registrationInfo: z.string().trim().max(2000).default(''),
  registrationUrl: optionalUrl, coverAssetId: z.uuid().nullable().default(null),
  rsvpEnabled: z.boolean().default(false), isPublished: z.boolean().default(false),
}).refine((v) => Date.parse(v.endsAt) > Date.parse(v.startsAt), { path: ['endsAt'], message: 'La fecha final debe ser posterior al inicio.' })
  .refine((v) => v.location || v.virtualUrl, { path: ['location'], message: 'Indica un lugar o enlace virtual.' });
export const eventMutationSchema = z.object({ communityId: z.uuid(), id: z.uuid(), expectedVersion: z.number().int().min(1),
  operation: z.enum(['cancel', 'archive']), confirmed: z.literal(true) });
export const attendanceSchema = z.object({ eventId: z.uuid(), attending: z.boolean() });
export const eventMonthSchema = z.string().regex(/^(20\d{2})-(0[1-9]|1[0-2])$/);
export const eventCursorSchema = z.object({ id: z.uuid(), startsAt: z.iso.datetime({ offset: true }) });
export const eventQuerySchema = z.object({ communityId: z.uuid(), month: eventMonthSchema, cursor: eventCursorSchema.nullable().default(null) });
export type EventInput = z.infer<typeof eventSchema>;
