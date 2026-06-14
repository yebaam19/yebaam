'use server';

import { getServiceClient } from '@/utils/supabase/server';
import { adminGate, type ActionResult } from '../_shared';

/** All approved members across all music clubs, joined with club + profile. */
export async function listAllMusicClubMembers(): Promise<
  ActionResult<
    Array<{
      user_id: string;
      club_id: string;
      club_name: string;
      club_slug: string;
      role: string;
      joined_at: string;
      username: string | null;
      full_name: string | null;
      avatar_cf_image_id: string | null;
    }>
  >
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();
  const { data } = await svc
    .from('club_members')
    .select(
      'user_id, club_id, role, joined_at, clubs!inner(name, slug, category)',
    )
    .eq('status', 'approved')
    .eq('clubs.category', 'MUSICA')
    .order('joined_at', { ascending: false });
  type Row = {
    user_id: string;
    club_id: string;
    role: string;
    joined_at: string;
    clubs: { name: string; slug: string } | Array<{ name: string; slug: string }>;
  };
  const rows = ((data as unknown as Row[] | null) ?? []).map((r) => ({
    ...r,
    clubs: Array.isArray(r.clubs) ? r.clubs[0] : r.clubs,
  }));
  const { data: profiles } = await svc
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, avatar_cloudflare_id')
    .in(
      'id',
      rows.map((r) => r.user_id),
    );
  const profById = new Map<
    string,
    {
      username: string | null;
      full_name: string | null;
      avatar_cf_image_id: string | null;
    }
  >();
  for (const p of ((profiles ?? []) as Array<{
    id: string;
    username: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_cloudflare_id: string | null;
  }>)) {
    const composed = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
    profById.set(p.id, {
      username: p.username,
      full_name: p.display_name ?? (composed || null),
      avatar_cf_image_id: p.avatar_cloudflare_id,
    });
  }
  return {
    ok: true,
    data: rows.map((r) => {
      const p = profById.get(r.user_id);
      return {
        user_id: r.user_id,
        club_id: r.club_id,
        club_name: r.clubs?.name ?? '—',
        club_slug: r.clubs?.slug ?? '',
        role: r.role,
        joined_at: r.joined_at,
        username: p?.username ?? null,
        full_name: p?.full_name ?? null,
        avatar_cf_image_id: p?.avatar_cf_image_id ?? null,
      };
    }),
  };
}
