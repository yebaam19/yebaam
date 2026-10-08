import { z } from 'zod';
import { documentContentType } from '@/lib/upload-documents';
import { MAX_DOCUMENT_BYTES } from '@/lib/upload-limits';

const id = z.uuid();
const version = z.number().int().min(1).max(2147483646);
export const assetKindSchema = z.enum(['image', 'video', 'document']);
export const libraryScopeSchema = z.object({ communityId: id });
export const libraryCursorSchema = z.object({ id, createdAt: z.iso.datetime({ offset: true }) });
export const libraryQuerySchema = libraryScopeSchema.extend({
  kind: assetKindSchema, folderId: id.nullable().optional(), cursor: libraryCursorSchema.nullable().default(null),
  search: z.string().trim().max(100).default(''),
  pdfOnly: z.boolean().default(false),
});
export const documentUploadSchema = libraryScopeSchema.extend({
  uploadId: id, fileName: z.string().trim().min(1).max(255),
  contentType: z.string().min(1).max(150), sizeBytes: z.number().int().min(1).max(MAX_DOCUMENT_BYTES),
}).refine((value) => documentContentType(value.fileName, value.contentType) === value.contentType, { message: 'Formato no compatible.' });
export const assetMetadataSchema = libraryScopeSchema.extend({
  id, title: z.string().trim().min(1).max(200), description: z.string().trim().max(4000).default(''),
  folderId: id.nullable().default(null), visibility: z.enum(['editors', 'members', 'public']).default('editors'),
  isPublished: z.boolean().default(false), expectedVersion: version,
});
export const finalizeAssetSchema = libraryScopeSchema.extend({
  id, kind: assetKindSchema, mediaId: z.string().min(20).max(64),
  title: z.string().trim().min(1).max(200), fileName: z.string().trim().min(1).max(255),
  contentType: z.string().min(1).max(150),
  replaceId: id.optional(), expectedVersion: version.optional(),
}).refine((value) => Boolean(value.replaceId) === (value.expectedVersion !== undefined));
export const folderInputSchema = libraryScopeSchema.extend({
  id, kind: assetKindSchema, title: z.string().trim().min(1).max(120),
  isVisible: z.boolean().default(false), expectedVersion: version.optional(),
});
export const deleteAssetSchema = libraryScopeSchema.extend({ id, expectedVersion: version, confirmed: z.literal(true) });
export const attachmentInputSchema = libraryScopeSchema.extend({ id, pointId: id, assetId: id, position: z.number().int().min(0).max(2147483647).default(0) });
export const detachAttachmentSchema = attachmentInputSchema.extend({ confirmed: z.literal(true) });
