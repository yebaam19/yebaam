import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { requirePageOwner } from '@/lib/api/page-authz';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string; userId: string }> }
) {
  const { idOrSlug, userId } = await context.params;
  const client = await getServerClient();

  // Retirar a alguien del equipo es un acto de autoridad: sólo el propietario.
  const authz = await requirePageOwner(client, idOrSlug);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const { error } = await client
    .from('page_team_members')
    .delete()
    .eq('page_id', authz.page.id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
