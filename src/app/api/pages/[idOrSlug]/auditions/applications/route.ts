import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { resolvePage } from '@/lib/api/page-authz';
import { canManagePage } from '@/lib/api/page-team';
import { getUserDisplayName } from '@/lib/user-helpers';
import { withImageVariant } from '@/lib/media/urls';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ApplicationRow = {
  id: string;
  audition_id: string;
  user_id: string;
  message: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

/**
 * GET /api/pages/[idOrSlug]/auditions/applications?auditionId=<uuid>
 * Owner/team-only roster of applicants for one audition of the page.
 * → 200 { applications: [{ id, auditionId, userId, message, createdAt,
 *          user: { id, username, displayName, avatarUrl } }] }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const auditionId = new URL(request.url).searchParams.get('auditionId');
  if (!auditionId || !UUID_RE.test(auditionId)) {
    return NextResponse.json({ error: 'auditionId required' }, { status: 400 });
  }

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  if (!(await canManagePage(client, page.id, userId, page.ownerId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // The audition must belong to THIS page — a mismatched id is a 404, not a
  // window into another page's applicants.
  const { data: audition } = await client
    .from('page_auditions')
    .select('id, page_id')
    .eq('id', auditionId)
    .maybeSingle();
  if (!audition || (audition as { page_id: string }).page_id !== page.id) {
    return NextResponse.json({ error: 'Audition not found' }, { status: 404 });
  }

  const { data, error } = await client
    .from('page_audition_applications')
    .select('id, audition_id, user_id, message, created_at')
    .eq('audition_id', auditionId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as ApplicationRow[];
  const applicantIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = applicantIds.length
    ? await client
        .from('profiles')
        .select('id, username, first_name, last_name, display_name, avatar_url')
        .in('id', applicantIds)
    : { data: [] as ProfileRow[] };

  const profileMap = new Map<string, ProfileRow>();
  for (const p of (profiles ?? []) as ProfileRow[]) profileMap.set(p.id, p);

  return NextResponse.json({
    applications: rows.map((r) => {
      const p = profileMap.get(r.user_id);
      return {
        id: r.id,
        auditionId: r.audition_id,
        userId: r.user_id,
        message: r.message,
        createdAt: r.created_at,
        user: {
          id: r.user_id,
          username: p?.username ?? '',
          displayName: getUserDisplayName({
            firstName: p?.first_name,
            lastName: p?.last_name,
            displayName: p?.display_name,
            username: p?.username,
          }),
          // Applicant chip is small — ship the `avatar` variant.
          avatarUrl: p?.avatar_url ? withImageVariant(p.avatar_url, 'avatar') : null,
        },
      };
    }),
  });
}
