import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { resolvePage } from '@/lib/api/page-authz';
import type { ProfileLite } from '@/lib/api/pages';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json([], { status: 404 });
  const pageId = page.id;

  // El roster de seguidores es dato personal (Macro Reglamento Art. 2/5): la lista
  // con identidad completa sólo se entrega al titular o su equipo. Para el resto
  // (incl. anónimos) se devuelve una lista vacía; el CONTEO público sigue
  // disponible vía el followerCount que expone mapPage. No unir `profiles` salvo
  // que el llamante esté autorizado.
  const { data: auth } = await client.auth.getUser();
  const viewerId = auth?.user?.id ?? null;
  let isPrivileged = viewerId != null && viewerId === page.ownerId;
  if (viewerId && !isPrivileged) {
    const { data: teamRow } = await client
      .from('page_team_members')
      .select('role')
      .eq('page_id', pageId)
      .eq('user_id', viewerId)
      .maybeSingle();
    isPrivileged = Boolean(teamRow);
  }
  if (!isPrivileged) return NextResponse.json([]);

  const { data: follows, error } = await client
    .from('page_followers')
    .select('user_id,created_at')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (follows ?? []) as Array<{ user_id: string; created_at: string }>;
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await client
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .in('id', userIds)
    : { data: [] as ProfileLite[] };

  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);

  return NextResponse.json(
    rows.map((r) => {
      const p = profileMap.get(r.user_id);
      return {
        userId: r.user_id,
        username: p?.username ?? '',
        firstName: p?.first_name ?? '',
        lastName: p?.last_name ?? '',
        avatarUrl: p?.avatar_url ?? undefined,
        followedAt: r.created_at,
      };
    })
  );
}
