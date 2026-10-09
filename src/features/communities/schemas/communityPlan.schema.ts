import { z } from 'zod';

const id = z.uuid();
const title = z.string().trim().min(1).max(200);
const description = z.string().trim().max(4000);
const version = z.number().int().min(1).max(2147483646);

export const planScopeSchema = z.object({ communityId: id, sectionId: id });
export const planCursorSchema = z.object({
  position: z.number().int().min(0).max(2147483647),
  id,
});
export const sectionInputSchema = z.object({
  communityId: id,
  id,
  kind: z.enum(['about', 'rules', 'government', 'economy', 'leaders']),
  title: title.max(120),
  position: z.number().int().min(0).max(2147483647).default(0),
  isVisible: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  expectedVersion: version.optional(),
});
export const planItemInputSchema = planScopeSchema.extend({
  id,
  kind: z.enum(['axis', 'point']),
  axisId: id.optional(),
  title,
  description: description.default(''),
  content: z.string().max(200000).default('').refine(
    (value) => new TextEncoder().encode(value).byteLength <= 200000,
    'El contenido supera el tamaño permitido.',
  ),
  isPublished: z.boolean().default(false),
  expectedVersion: version.optional(),
}).refine((value) => value.kind !== 'point' || Boolean(value.axisId), {
  message: 'Selecciona un eje para el punto.', path: ['axisId'],
});
export const movePlanItemSchema = planScopeSchema.extend({
  id,
  kind: z.enum(['axis', 'point']),
  expectedVersion: version,
  destinationAxis: id.nullable().default(null),
  beforeId: id.nullable().default(null),
}).refine((value) => value.kind === 'axis' ? value.destinationAxis === null : value.destinationAxis !== null, {
  message: 'El destino no corresponde al tipo de contenido.',
});
export const deletePlanItemSchema = planScopeSchema.extend({
  id,
  kind: z.enum(['axis', 'point']),
  expectedVersion: version,
  confirmed: z.literal(true),
});
