import 'server-only';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { plainArticleText, sanitizeCommunityArticleContent } from '../../lib/article-content';

const articleFields = z.object({
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(240).optional(),
  content: z.string().max(200_000),
  summary: z.string().trim().max(500).optional(),
  category: z.string().trim().max(120).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
  coverAssetId: z.uuid().nullable().optional(),
  attachmentIds: z.array(z.uuid()).max(20).optional(),
  isPublished: z.boolean(),
  keepLegacyCover: z.boolean().optional(),
});

export function normalizeArticleFields(input: unknown):
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; error: string } {
  const parsed = articleFields.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revisa el título, la categoría, las etiquetas y los adjuntos.' };
  const fields = parsed.data;
  const content = sanitizeCommunityArticleContent(fields.content.trim());
  const text = plainArticleText(content);
  if (fields.isPublished && text.length < 20) {
    return { ok: false, error: 'Agrega al menos 20 caracteres antes de publicar.' };
  }
  if (new TextEncoder().encode(content).length > 200_000) {
    return { ok: false, error: 'El artículo supera el tamaño permitido.' };
  }
  if (new Set(fields.attachmentIds ?? []).size !== (fields.attachmentIds ?? []).length) {
    return { ok: false, error: 'Hay archivos adjuntos repetidos.' };
  }
  return { ok: true, payload: {
    title: fields.title,
    subtitle: fields.subtitle ?? '',
    content,
    summary: fields.summary || text.slice(0, 220),
    category: fields.category ?? '',
    tags: fields.tags ?? [],
    coverAssetId: fields.coverAssetId ?? null,
    attachmentIds: fields.attachmentIds ?? [],
    isPublished: fields.isPublished,
    keepLegacyCover: fields.keepLegacyCover ?? true,
  } };
}

export function revalidateCommunityArticlePaths(): void {
  revalidatePath('/feed/comunidades/[slug]', 'page');
  revalidatePath('/feed/comunidades/[slug]/articulos', 'page');
  revalidatePath('/feed/comunidades/[slug]/articulos/[articleSlug]', 'page');
}
