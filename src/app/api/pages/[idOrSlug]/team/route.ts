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

  // El roster de equipo es público por diseño (PDF §4 "Equipo de Trabajo"), pero
  // `resolvePage` corre bajo el cliente con sesión del llamante: una página
  // restringida que el viewer no puede ver resuelve a null → 404, no fuga.
  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json([], { status: 404 });
  const pageId = page.id;

  const { data, error } = await client
    .from('page_team_members')
    .select('user_id,role,assigned_at')
    .eq('page_id', pageId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Array<{ user_id: string; role: string; assigned_at: string }>;
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await client
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url,bio')
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
        bio: p?.bio ?? undefined,
        role: r.role,
        joinedAt: r.assigned_at,
      };
    })
  );
}
