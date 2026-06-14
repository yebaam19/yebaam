'use server';

import { getServiceClient } from '@/utils/supabase/server';
import { adminGate, type ActionResult } from '../_shared';

/** Recent posts across all music clubs for the moderation panel. */
export async function listRecentMusicClubPosts(
  limit = 30,
): Promise<
  ActionResult<
    Array<{
      id: string;
      club_id: string;
      club_name: string;
      club_slug: string;
      author_id: string;
      author_name: string | null;
      title: string | null;
      body: string | null;
      created_at: string;
    }>
  >
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();
  const { data } = await svc
    .from('club_posts')
    .select('id, club_id, author_id, title, body, created_at, clubs!inner(name, slug, category)')
    .eq('clubs.category', 'MUSICA')
    .order('created_at', { ascending: false })
    .limit(limit);
  type Row = {
    id: string;
    club_id: string;
    author_id: string;
    title: string | null;
    body: string | null;
    created_at: string;
    clubs:
      | { name: string; slug: string }
      | Array<{ name: string; slug: string }>;
  };
  const rows = ((data as unknown as Row[] | null) ?? []).map((r) => ({
    ...r,
    clubs: Array.isArray(r.clubs) ? r.clubs[0] : r.clubs,
  }));
  if (rows.length === 0) return { ok: true, data: [] };
  const { data: profiles } = await svc
    .from('profiles')
    .select('id, username, display_name, first_name, last_name')
    .in(
      'id',
      rows.map((r) => r.author_id),
    );
  const nameById = new Map<string, string | null>();
  for (const p of ((profiles ?? []) as Array<{
    id: string;
    username: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  }>)) {
    const composed = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
    nameById.set(p.id, p.display_name ?? composed ?? p.username ?? null);
  }
  return {
    ok: true,
    data: rows.map((r) => ({
      id: r.id,
      club_id: r.club_id,
      club_name: r.clubs?.name ?? '—',
      club_slug: r.clubs?.slug ?? '',
      author_id: r.author_id,
      author_name: nameById.get(r.author_id) ?? null,
      title: r.title,
      body: r.body,
      created_at: r.created_at,
    })),
  };
}
