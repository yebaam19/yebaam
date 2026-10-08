import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import { getLibraryAsset } from '@/features/communities/server/community-library.server';
import { signLibraryDocument } from '@/lib/cloudflare/community-documents';

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
export async function GET(request: NextRequest, context: { params: Promise<{ communityId: string; assetId: string }> }) {
  const params = z.object({ communityId: z.uuid(), assetId: z.uuid() }).safeParse(await context.params);
  if (!params.success) return NextResponse.json({ error: 'Archivo no encontrado.' }, { status: 404, headers });
  try {
    const client = await getServerClient();
    await client.auth.getUser(); // Validate/refresh optional session; public documents also support visitors.
    const asset = await getLibraryAsset(params.data.communityId, params.data.assetId);
    if (!asset || asset.kind !== 'document') return NextResponse.json({ error: 'Archivo no encontrado.' }, { status: 404, headers });
    // The row is read with the caller's client and RLS before any secret is used.
    const url = await signLibraryDocument(asset.media_id, asset.original_name, asset.content_type, request.nextUrl.searchParams.get('preview') === '1');
    return NextResponse.redirect(url, { status: 307, headers });
  } catch {
    return NextResponse.json({ error: 'No se pudo abrir el archivo. Inténtalo de nuevo.' }, { status: 503, headers });
  }
}
