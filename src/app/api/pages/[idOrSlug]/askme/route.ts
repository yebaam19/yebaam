import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { resolvePage } from '@/lib/api/page-authz';
import { canManagePage } from '@/lib/api/page-team';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;
  const isTeam =
    viewerId &&
    (await canManagePage(client, page.id, viewerId, page.ownerId, [
      'ADMIN',
      'EDITOR',
      'OWNER',
      'MODERATOR',
    ]));

  let query = client
    .from('page_askme_questions')
    .select('*')
    .eq('page_id', page.id)
    .order('created_at', { ascending: false });

  if (!isTeam) {
    query = query.or(`status.eq.approved,asker_id.eq.${viewerId ?? '00000000-0000-0000-0000-000000000000'}`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: r.id,
      question: r.question,
      answer: r.answer ?? null,
      answeredAt: r.answered_at ?? null,
      isAnonymous: r.is_anonymous,
      voteCount: r.vote_count ?? 0,
      status: r.status,
      createdAt: r.created_at,
      isMine: viewerId && r.asker_id === viewerId,
    }))
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // Team answering an existing question — must be checked BEFORE the
  // 'question required' guard: answer requests carry no `question` field.
  if (typeof body.questionId === 'string' && typeof body.answer === 'string') {
    if (!(await canManagePage(client, page.id, userId, page.ownerId, ['ADMIN', 'EDITOR', 'OWNER', 'MODERATOR']))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { error } = await client
      .from('page_askme_questions')
      .update({
        answer: body.answer.trim(),
        answered_by: userId,
        answered_at: new Date().toISOString(),
        status: 'approved',
      })
      .eq('id', body.questionId)
      .eq('page_id', page.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) return NextResponse.json({ error: 'question required' }, { status: 400 });

  const { data, error } = await client
    .from('page_askme_questions')
    .insert({
      page_id: page.id,
      asker_id: userId,
      question,
      is_anonymous: body.isAnonymous === true,
      status: 'approved',
    })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
