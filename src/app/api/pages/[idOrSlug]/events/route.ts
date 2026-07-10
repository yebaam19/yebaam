import { NextResponse, type NextRequest, after } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { resolvePage } from '@/lib/api/page-authz';
import { canManagePage } from '@/lib/api/page-team';
import { resolveImageRef } from '@/lib/media/urls';
import { notifyPageOwner } from '@/lib/api/page-notifications';

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

  const { data, error } = await client
    .from('page_events')
    .select('*')
    .eq('page_id', page.id)
    .order('starts_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const events = (data ?? []) as Array<Record<string, unknown>>;
  const eventIds = events.map((e) => e.id as string);

  const { data: rsvps } = eventIds.length
    ? await client.from('page_event_rsvps').select('event_id,status,user_id').in('event_id', eventIds)
    : { data: [] as Array<{ event_id: string; status: string; user_id: string }> };

  const rsvpRows = (rsvps ?? []) as Array<{ event_id: string; status: string; user_id: string }>;
  const goingCounts = new Map<string, number>();
  const myRsvp = new Map<string, string>();
  for (const r of rsvpRows) {
    if (r.status === 'going') goingCounts.set(r.event_id, (goingCounts.get(r.event_id) ?? 0) + 1);
    if (viewerId && r.user_id === viewerId) myRsvp.set(r.event_id, r.status);
  }

  return NextResponse.json(
    events.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? null,
      coverUrl: resolveImageRef(r.cover_cf_image_id as string | null, 'cover'),
      startsAt: r.starts_at,
      endsAt: r.ends_at ?? null,
      place: r.place ?? null,
      mapUrl: r.map_url ?? null,
      ticketUrl: r.ticket_url ?? null,
      goingCount: goingCounts.get(r.id as string) ?? 0,
      myRsvp: myRsvp.get(r.id as string) ?? null,
      // Alias kept in sync with myRsvp — new consumers should read viewerRsvp.
      viewerRsvp: myRsvp.get(r.id as string) ?? null,
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

  if (typeof body.eventId === 'string' && typeof body.rsvp === 'string') {
    const status = body.rsvp;
    if (!['going', 'interested', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'invalid rsvp' }, { status: 400 });
    }

    // The event must belong to THIS page — otherwise a caller could RSVP to
    // any event through any page's URL (and notify the wrong owner).
    const { data: event } = await client
      .from('page_events')
      .select('id, page_id')
      .eq('id', body.eventId)
      .maybeSingle();
    if (!event || (event as { page_id: string }).page_id !== page.id) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only notify when the viewer BECOMES 'going' — re-submitting the same
    // status must not spam the owner.
    const { data: prevRsvp } = await client
      .from('page_event_rsvps')
      .select('status')
      .eq('event_id', body.eventId)
      .eq('user_id', userId)
      .maybeSingle();
    const prevStatus = (prevRsvp as { status?: string } | null)?.status ?? null;

    const { error } = await client.from('page_event_rsvps').upsert(
      { event_id: body.eventId, user_id: userId, status },
      { onConflict: 'event_id,user_id' }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (status === 'going' && prevStatus !== 'going') {
      after(async () => {
        await notifyPageOwner({
          pageId: page.id,
          type: 'page_event',
          actorId: userId,
          message: 'confirmó asistencia a un evento de tu página',
        });
      });
    }
    return NextResponse.json({ success: true });
  }

  if (!(await canManagePage(client, page.id, userId, page.ownerId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const startsAt = typeof body.startsAt === 'string' ? body.startsAt : '';
  if (!title || !startsAt) {
    return NextResponse.json({ error: 'title and startsAt required' }, { status: 400 });
  }

  const { data, error } = await client
    .from('page_events')
    .insert({
      page_id: page.id,
      title,
      description: typeof body.description === 'string' ? body.description : null,
      starts_at: startsAt,
      ends_at: typeof body.endsAt === 'string' ? body.endsAt : null,
      place: typeof body.place === 'string' ? body.place : null,
      map_url: typeof body.mapUrl === 'string' ? body.mapUrl : null,
      ticket_url: typeof body.ticketUrl === 'string' ? body.ticketUrl : null,
      cover_cf_image_id: typeof body.coverCfImageId === 'string' ? body.coverCfImageId : null,
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

  const { error } = await client.from('page_events').delete().eq('id', id).eq('page_id', page.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
