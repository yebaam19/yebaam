'use server';

import { z } from 'zod';
import { requireSession } from '../_shared';
import type { CreateCommunityArticleInput, UpdateCommunityArticleInput } from '../../types/communityArticle.types';
import type { Result, DeleteResult } from './types';
import { normalizeArticleFields, revalidateCommunityArticlePaths } from './_helpers';

const savedSchema = z.object({ id: z.uuid(), slug: z.string().min(1), version: z.number().int().positive() });

function writeError(message?: string): Result {
  if (message?.includes('Version conflict')) return { ok: false, error: 'El artículo cambió en otra ventana. Recarga la página antes de guardar.' };
  if (message?.includes('Library asset')) return { ok: false, error: 'Un archivo ya no está disponible. Revísalo en la biblioteca.' };
  return { ok: false, error: 'No se pudo guardar el artículo. Revisa tus permisos e inténtalo de nuevo.' };
}

async function saveArticle(communityId: string, id: string, version: number, input: unknown): Promise<Result> {
  const scope = z.object({ communityId: z.uuid(), id: z.uuid(), version: z.number().int().nonnegative() })
    .safeParse({ communityId, id, version });
  if (!scope.success) return { ok: false, error: 'Artículo inválido.' };
  const normalized = normalizeArticleFields(input);
  if (!normalized.ok) return normalized;
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const { data, error } = await session.client.rpc('save_community_article', {
    target_community: communityId, target_id: id, expected_version: version, payload: normalized.payload,
  });
  if (error) return writeError(error.message);
  const saved = savedSchema.safeParse(data);
  if (!saved.success) return { ok: false, error: 'La respuesta de guardado fue inválida.' };
  revalidateCommunityArticlePaths();
  return { ok: true, ...saved.data };
}

export async function createCommunityArticle(input: CreateCommunityArticleInput): Promise<Result> {
  return saveArticle(input.communityId, input.id, 0, input);
}

export async function updateCommunityArticle(input: UpdateCommunityArticleInput): Promise<Result> {
  return saveArticle(input.communityId, input.articleId, input.expectedVersion, input);
}

export async function deleteCommunityArticle(articleId: string): Promise<DeleteResult> {
  if (!z.uuid().safeParse(articleId).success) return { ok: false, error: 'Artículo inválido.' };
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const { data: article, error: loadError } = await session.client.from('community_articles')
    .select('community_id,version').eq('id', articleId).maybeSingle();
  if (loadError || !article) return { ok: false, error: 'No se encontró el artículo.' };
  const { error } = await session.client.rpc('change_community_article', {
    target_community: article.community_id, target_id: articleId, expected_version: article.version,
    operation: 'archive', reason: '', confirmed: true,
  });
  if (error) return { ok: false, error: 'No se pudo eliminar el artículo.' };
  revalidateCommunityArticlePaths();
  return { ok: true };
}
