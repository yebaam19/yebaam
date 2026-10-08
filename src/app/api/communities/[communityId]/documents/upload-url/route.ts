import { NextResponse, type NextRequest } from 'next/server';
import { documentUploadSchema } from '@/features/communities/schemas/communityLibrary.schema';
import { requireProfileSession } from '@/features/communities/server/profile-session.server';
import { signCommunityDocument } from '@/features/communities/server/document-upload.server';
import { checkRateLimit } from '@/lib/api/rate-limit';

const headers = { 'Cache-Control': 'private, no-store' };
export async function POST(request: NextRequest, context: { params: Promise<{ communityId: string }> }) {
  const { communityId } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = documentUploadSchema.safeParse({ ...(body && typeof body === 'object' ? body : {}), communityId });
  if (!parsed.success) return NextResponse.json({ error: 'Revisa el formato y tamaño del archivo (máximo 10 MB).' }, { status: 400, headers });
  try {
    const auth = await requireProfileSession(communityId, 'content');
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers });
    const rate = checkRateLimit(`community-document:${auth.session.userId}`, { limit: 60, windowMs: 3600000 });
    if (!rate.ok) return NextResponse.json({ error: 'Has realizado demasiadas cargas. Inténtalo más tarde.' }, {
      status: 429, headers: { ...headers, 'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)) },
    });
    const data = await signCommunityDocument(auth.session, parsed.data);
    return NextResponse.json({ success: true, data }, { headers });
  } catch {
    return NextResponse.json({ error: 'No se pudo preparar la carga. Inténtalo de nuevo.' }, { status: 503, headers });
  }
}
