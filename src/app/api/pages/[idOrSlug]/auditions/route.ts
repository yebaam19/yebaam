import { NextResponse, type NextRequest, after } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { resolvePage } from '@/lib/api/page-authz';
import { canManagePage } from '@/lib/api/page-team';
import { notifyPageOwner } from '@/lib/api/page-notifications';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const { data, error } = await client
    .from('page_auditions')
    .select('*')
    .eq('page_id', page.id)
    .order('starts_at', { ascending: true, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Array<Record<string, unknown>>;

  // Signed-in viewers see whether they already applied (RLS lets them read
  // their own application rows only).
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;
  const appliedIds = new Set<string>();
  if (viewerId && rows.length) {
    const { data: apps } = await client
      .from('page_audition_applications')
      .select('audition_id')
      .eq('user_id', viewerId)
      .in('audition_id', rows.map((r) => r.id as string));
    for (const a of (apps ?? []) as Array<{ audition_id: string }>) {
      appliedIds.add(a.audition_id);
    }
  }

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? null,
      city: r.city ?? null,
      requirements: r.requirements ?? null,
      startsAt: r.starts_at ?? null,
      endsAt: r.ends_at ?? null,
      createdAt: r.created_at,
      viewerApplied: appliedIds.has(r.id as string),
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

  // Apply to audition
  if (typeof body.auditionId === 'string' && body.apply === true) {
    // The audition must belong to THIS page — otherwise a caller could apply
    // to any audition through any page's URL (and notify the wrong owner).
    const { data: audition } = await client
      .from('page_auditions')
      .select('id, page_id')
      .eq('id', body.auditionId)
      .maybeSingle();
    if (!audition || (audition as { page_id: string }).page_id !== page.id) {
      return NextResponse.json({ error: 'Audition not found' }, { status: 404 });
    }

    // page_audition_applications has INSERT+SELECT RLS only, so an upsert's
    // UPDATE path on a repeat apply gets denied → 500. Detect the existing
    // row first and answer gracefully; ignoreDuplicates covers the race.
    const { data: existingApp } = await client
      .from('page_audition_applications')
      .select('id')
      .eq('audition_id', body.auditionId)
      .eq('user_id', userId)
      .maybeSingle();
    if (existingApp) {
      return NextResponse.json({ success: true, alreadyApplied: true });
    }

    const { error } = await client.from('page_audition_applications').upsert(
      {
        audition_id: body.auditionId,
        user_id: userId,
        message: typeof body.message === 'string' ? body.message : null,
        status: 'submitted',
      },
      { onConflict: 'audition_id,user_id', ignoreDuplicates: true }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    after(async () => {
      await notifyPageOwner({
        pageId: page.id,
        type: 'page_audition',
        actorId: userId,
        message: 'se postuló a una audición de tu página',
      });
    });
    return NextResponse.json({ success: true, alreadyApplied: false });
  }

  if (!(await canManagePage(client, page.id, userId, page.ownerId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const { data, error } = await client
    .from('page_auditions')
    .insert({
      page_id: page.id,
      title,
      description: typeof body.description === 'string' ? body.description : null,
      city: typeof body.city === 'string' ? body.city : null,
      requirements: typeof body.requirements === 'string' ? body.requirements : null,
      starts_at: typeof body.startsAt === 'string' ? body.startsAt : null,
      ends_at: typeof body.endsAt === 'string' ? body.endsAt : null,
      created_by: userId,
    })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  if (!(await canManagePage(client, page.id, userId, page.ownerId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await client
    .from('page_auditions')
    .delete()
    .eq('id', id)
    .eq('page_id', page.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
