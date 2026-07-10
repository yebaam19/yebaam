import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { requirePageOwner } from '@/lib/api/page-authz';

/**
 * `OWNER` queda FUERA a propósito: la propiedad vive en `pages.owner_id`, no en
 * `page_team_members`. Aceptarlo aquí permitía fabricar una fila de equipo con
 * rol OWNER que `check_page_admin` trata como administrador — autoridad por una
 * puerta lateral. Espeja `ASSIGNABLE_PAGE_ROLES` del cliente; que servidor y UI
 * discrepen sobre qué rol se puede otorgar es exactamente la divergencia que
 * CLAUDE.md prohíbe en superficies de auth.
 */
const VALID_ROLES = ['ADMIN', 'EDITOR', 'MODERATOR'];

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();

  // Sólo el propietario puede repartir autoridad sobre la página. Antes esta
  // ruta sólo comprobaba que el llamante estuviera autenticado y delegaba todo
  // en la policy RLS de page_team_members.
  const authz = await requirePageOwner(client, idOrSlug);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const body = (await request.json().catch(() => ({}))) as { userId?: string; role?: string };
  if (!body.userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  const role = (body.role ?? 'ADMIN').toUpperCase();
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // El propietario ya ostenta la autoridad máxima por `pages.owner_id`; darle
  // además una fila de equipo duplicaría su tarjeta en la pestaña Equipo.
  if (body.userId === authz.page.ownerId) {
    return NextResponse.json(
      { error: 'El propietario ya tiene autoridad total sobre la página' },
      { status: 400 }
    );
  }

  const pageId = authz.page.id;

  const { data: existing } = await client
    .from('page_team_members')
    .select('user_id')
    .eq('page_id', pageId)
    .eq('user_id', body.userId)
    .maybeSingle();

  if (existing) {
    const { error } = await client
      .from('page_team_members')
      .update({ role })
      .eq('page_id', pageId)
      .eq('user_id', body.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await client
      .from('page_team_members')
      .insert({ page_id: pageId, user_id: body.userId, role });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
