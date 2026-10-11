import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/features/families/actions/families-helpers';
import { familyDocumentKey } from '@/features/families/lib/document-storage';
import { canUploadFamilyDocument } from '@/features/families/server/document-upload.server';
import { getPresignedUploadUrl } from '@/lib/cloudflare/r2';
import { MAX_DOCUMENT_BYTES } from '@/lib/upload-limits';
import { checkRateLimit } from '@/lib/api/rate-limit';

const schema = z.object({
  familyId: z.string().uuid(),
  contentType: z.literal('application/pdf'),
  sizeBytes: z.number().int().positive().max(MAX_DOCUMENT_BYTES),
});
const headers = { 'Cache-Control': 'private, no-store' };

export async function POST(request: NextRequest, context: { params: Promise<{ familyId: string }> }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401, headers });
  const { familyId } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse({ ...(body && typeof body === 'object' ? body : {}), familyId });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Selecciona un PDF válido de hasta 10 MB.' }, { status: 400, headers });
  }
  if (!await canUploadFamilyDocument(session, familyId)) {
    return NextResponse.json({ error: 'No tienes permiso para subir documentos a esta familia.' }, { status: 403, headers });
  }
  const rate = checkRateLimit(`family-document:${session.userId}`, { limit: 60, windowMs: 3_600_000 });
  if (!rate.ok) {
    return NextResponse.json({ error: 'Demasiadas cargas. Inténtalo más tarde.' }, { status: 429, headers });
  }
  const key = familyDocumentKey(session.userId, familyId, crypto.randomUUID());
  try {
    const { url } = await getPresignedUploadUrl(key, parsed.data.contentType, 300, parsed.data.sizeBytes);
    return NextResponse.json({ success: true, data: { url, key } }, { headers });
  } catch {
    return NextResponse.json({ error: 'No se pudo preparar la carga.' }, { status: 503, headers });
  }
}
