import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { getPresignedUploadUrl } from '@/lib/cloudflare/r2';
import { MAX_DOCUMENT_BYTES } from '@/lib/upload-limits';

// Documentos PDF (CVs de servicios profesionales). Separado de
// /api/upload/audio-url (claves `tracks/…` + rate limit de music_tracks):
// aquí las claves viven bajo `cvs/…` y el gate de acceso es ser dueño de al
// menos un servicio profesional — sin exención para platform_admins.
const ALLOWED_MIMES = new Set(['application/pdf']);

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
};

export async function POST(request: NextRequest) {
  const client = await getServerClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let contentType: string;
  let sizeBytes: number | undefined;
  try {
    const body = (await request.json()) as { contentType?: string; sizeBytes?: number } | null;
    contentType = body?.contentType ?? '';
    if (typeof body?.sizeBytes === 'number' && Number.isFinite(body.sizeBytes)) {
      sizeBytes = Math.floor(body.sizeBytes);
    }
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!contentType || !ALLOWED_MIMES.has(contentType)) {
    return NextResponse.json({ error: 'Solo se permiten documentos PDF.' }, { status: 400 });
  }

  // El tamaño declarado es obligatorio: se rechaza aquí antes de firmar y
  // además se ata a la firma (ContentLength) abajo, así el cliente no puede
  // subir un archivo más grande de lo que declaró.
  if (sizeBytes === undefined || sizeBytes <= 0) {
    return NextResponse.json({ error: 'Falta el tamaño del archivo (sizeBytes).' }, { status: 400 });
  }
  if (sizeBytes > MAX_DOCUMENT_BYTES) {
    return NextResponse.json(
      { error: `El documento supera el tamaño máximo permitido (${Math.round(MAX_DOCUMENT_BYTES / (1024 * 1024))} MB).` },
      { status: 400 },
    );
  }

  // Gate de acceso: solo quien ya es dueño de al menos un servicio profesional
  // puede subir un CV (el CV se adjunta a un servicio existente).
  const { data: serviceRow } = await client
    .from('professional_services')
    .select('id')
    .eq('user_id', userData.user.id)
    .limit(1)
    .maybeSingle();
  if (!serviceRow) {
    return NextResponse.json(
      { error: 'Necesitas un servicio profesional publicado para subir un CV.' },
      { status: 403 },
    );
  }

  const ext = MIME_TO_EXT[contentType];
  const year = new Date().getUTCFullYear();
  const uuid = crypto.randomUUID();
  const key = `cvs/${year}/${uuid}.${ext}`;

  try {
    // 15 min TTL: enough slack for slow devices between signing and the PUT
    // actually starting; expiry is only checked when the request starts.
    const { url } = await getPresignedUploadUrl(key, contentType, 900, sizeBytes);
    return NextResponse.json({ success: true, data: { url, key } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'No se pudo firmar la URL';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
