import { z } from 'zod';
const scope = { communityId: z.uuid(), id: z.uuid(), expectedVersion: z.number().int().min(0) };
export const questionSchema = z.object({
  ...scope,
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(6000),
  categoryId: z.uuid().nullable().default(null),
  isPublished: z.boolean().default(false),
});
export const questionAnswerSchema = z.object({
  ...scope, questionId: z.uuid(), body: z.string().trim().min(1).max(10000),
  isPublished: z.boolean().default(false),
});
export const questionCategorySchema = z.object({
  ...scope, title: z.string().trim().min(1).max(120), position: z.number().int().min(0),
  isPublished: z.boolean().default(false), archive: z.boolean().default(false), confirmed: z.boolean().default(false),
}).refine((v) => !v.archive || (v.confirmed && v.expectedVersion > 0), { message: 'Confirma la eliminación.' });
const mutation = {
  ...scope, expectedVersion: z.number().int().min(1),
  reason: z.string().trim().max(1000).default(''), confirmed: z.boolean().default(false),
};
const confirmation = (v: { operation: string; reason: string; confirmed: boolean }) =>
  (!['hide', 'archive'].includes(v.operation) || v.confirmed) && (v.operation !== 'hide' || v.reason.length > 0);
export const questionMutationSchema = z.object({
  ...mutation, operation: z.enum(['close', 'reopen', 'faq', 'unfaq', 'hide', 'restore', 'archive', 'categorize']),
  categoryId: z.uuid().nullable().default(null),
}).refine(confirmation, { message: 'Confirma la acción e indica el motivo de moderación.' });
export const answerMutationSchema = z.object({
  ...mutation, questionId: z.uuid(), operation: z.enum(['hide', 'restore', 'archive']),
}).refine(confirmation, { message: 'Confirma la acción e indica el motivo de moderación.' });
export const questionCursorSchema = z.object({ id: z.uuid(), createdAt: z.iso.datetime({ offset: true }) });
export const categoryCursorSchema = z.object({ id: z.uuid(), position: z.number().int().min(0) });
export const questionQuerySchema = z.object({
  communityId: z.uuid(), search: z.string().trim().max(160).default(''),
  categoryId: z.uuid().nullable().optional(), view: z.enum(['all', 'mine', 'faq', 'moderation']).default('all'),
  state: z.enum(['all', 'open', 'closed']).default('all'), cursor: questionCursorSchema.nullable().default(null),
});
export const answerQuerySchema = z.object({ communityId: z.uuid(), questionId: z.uuid(), cursor: questionCursorSchema.nullable().default(null) });
export const categoryQuerySchema = z.object({ communityId: z.uuid(), cursor: categoryCursorSchema.nullable().default(null) });
export type QuestionQuery = z.infer<typeof questionQuerySchema>;
