'use server';

import { withImageVariant } from '@/lib/media/urls';
import { sanitizePostgrestFilterTerm } from '@/lib/supabase-filter';
import { getServiceClient } from '@/utils/supabase/server';
import { ActionResult,ClubMemberCandidate,canManageClubMembers,requireUser } from './clubs-helpers';

export async function searchClubMemberCandidatesAction(
  clubId: string,
  input: { query?: string; studyPlace?: string; limit?: number },
): Promise<ActionResult<{ candidates: ClubMemberCandidate[] }>> {
  const { client, userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const canManage = await canManageClubMembers(client, clubId, userId);
  if (!canManage) return { ok: false, error: 'No tienes permiso para buscar miembros' };

  const studyPlace = (input.studyPlace ?? '').trim();
  const query = (input.query ?? '').trim();
  if (!studyPlace && query.length < 2) {
    return { ok: false, error: 'Escribe al menos 2 caracteres o un colegio para buscar' };
  }

  const limit = Math.min(Math.max(input.limit ?? 20, 1), 20);

  const svc = getServiceClient();
  const { data: memberRows } = await svc
    .from('club_members')
    .select('user_id')
    .eq('club_id', clubId);
  const excludeIds = new Set(
    ((memberRows ?? []) as { user_id: string }[]).map((r) => r.user_id),
  );
  excludeIds.add(userId);

  let q = svc
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url, study_place');

  // Service-role query + free text: strip PostgREST grammar chars and escape
  // wildcards so the term can only ever be a literal substring.
  if (studyPlace) {
    q = q.ilike('study_place', `%${sanitizePostgrestFilterTerm(studyPlace)}%`);
  }
  if (query.length >= 2) {
    const pattern = `%${sanitizePostgrestFilterTerm(query)}%`;
    q = q.or(
      `username.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`,
    );
  }

  const { data, error } = await q.limit(limit);
  if (error) return { ok: false, error: error.message };

  type ProfileRow = {
    id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    study_place: string | null;
  };

  const candidates = ((data ?? []) as ProfileRow[])
    .filter((row) => !excludeIds.has(row.id))
    .map((row) => ({
      id: row.id,
      username: row.username ?? '',
      displayName:
        [row.first_name, row.last_name].filter(Boolean).join(' ') ||
        row.username ||
        'Sin nombre',
      avatarUrl: row.avatar_url ? withImageVariant(row.avatar_url, 'avatar') : null,
      studyPlace: row.study_place,
    }));

  return { ok: true, data: { candidates } };
}
