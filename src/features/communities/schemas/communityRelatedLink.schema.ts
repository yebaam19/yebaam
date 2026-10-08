import { z } from 'zod';
import { isSafeExternalUrl } from '@/lib/safe-href';

export const relatedLinkCursorSchema = z.object({
  position: z.number().int().min(0), id: z.uuid(),
});
export const relatedLinkScopeSchema = z.object({
  communityId: z.uuid(), cursor: relatedLinkCursorSchema.nullable().optional(),
});
export const relatedLinkWriteSchema = z.object({
  communityId: z.uuid(), id: z.uuid(), expectedVersion: z.number().int().min(0),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(280),
  href: z.string().trim().max(2048).refine(isSafeExternalUrl),
  imageAssetId: z.uuid().nullable(),
  position: z.number().int().min(0).max(100000),
  isPublished: z.boolean(),
}).refine((value) => !value.isPublished || Boolean(value.imageAssetId), {
  message: 'Selecciona una imagen pública antes de publicar.',
});
export const relatedLinkArchiveSchema = z.object({
  communityId: z.uuid(), id: z.uuid(), expectedVersion: z.number().int().min(1),
});
