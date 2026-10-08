'use server';

import { libraryQuerySchema, libraryScopeSchema, libraryCursorSchema, assetKindSchema } from '../../schemas/communityLibrary.schema';
import { getLibraryAssets, getAssetFolders, getPlanAttachments } from '../../server/community-library.server';
import { planCursorSchema } from '../../schemas/communityPlan.schema';
import { z } from 'zod';
import type { ActionResult } from '../_shared';
import type { LibraryPage, FolderPage, PlanAttachment } from '../../types/communityLibrary.types';
import type { PlanPage } from '../../types/communityPlan.types';

export async function loadPlanAttachments(input: unknown): Promise<ActionResult<PlanPage<PlanAttachment>>> {
  const parsed = libraryScopeSchema.extend({ pointId: z.uuid(), cursor: planCursorSchema.nullable() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'La página no es válida.' };
  try {
    const { communityId, pointId, cursor } = parsed.data;
    return { ok: true, data: await getPlanAttachments(communityId, pointId, cursor ? JSON.stringify(cursor) : null) };
  } catch { return { ok: false, error: 'No se pudieron cargar los adjuntos. Inténtalo de nuevo.' }; }
}

export async function loadLibraryAssets(input: unknown): Promise<ActionResult<LibraryPage>> {
  const parsed = libraryQuerySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'La búsqueda no es válida.' };
  try {
    const { communityId, kind, folderId, search, cursor, pdfOnly } = parsed.data;
    return { ok: true, data: await getLibraryAssets(communityId, kind, folderId, search, cursor ? JSON.stringify(cursor) : null, pdfOnly) };
  } catch { return { ok: false, error: 'No se pudo cargar la biblioteca. Inténtalo de nuevo.' }; }
}

export async function loadAssetFolders(input: unknown): Promise<ActionResult<FolderPage>> {
  const parsed = libraryScopeSchema.extend({ kind: assetKindSchema, cursor: libraryCursorSchema.nullable() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'La página no es válida.' };
  try {
    const { communityId, kind, cursor } = parsed.data;
    return { ok: true, data: await getAssetFolders(communityId, kind, cursor ? JSON.stringify(cursor) : null) };
  } catch { return { ok: false, error: 'No se pudieron cargar las carpetas. Inténtalo de nuevo.' }; }
}
