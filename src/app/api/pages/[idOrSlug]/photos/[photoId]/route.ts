import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { resolvePage } from '@/lib/api/page-authz';
import { canManagePage } from '@/lib/api/page-team';

/**
 * Delete one photo from a page's gallery.
 *
 * Scoped two ways on purpose, matching the sibling deletes in this module
 * (artists:145-153, events:176-180, video-embeds:168-176): the caller must be
 * able to manage *this* page, and the delete is keyed on `(id, page_id)`. The
 * previous version keyed on `photoId` alone and discarded the `idOrSlug`
 * segment entirely, so it deleted by id from anywhere — a manager of page A
 * could pass page B's photo ids, and photo ids are readable from the
 * unauthenticated `GET /api/pages/<slug>/photos`.
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string; photoId: string }> }
) {
  const { idOrSlug, photoId } = await context.params;

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  if (!(await canManagePage(client, page.id, userId, page.ownerId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await client
    .from('page_photos')
    .delete()
    .eq('id', photoId)
    .eq('page_id', page.id)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Zero rows means the photo does not belong to this page (or never existed) —
  // reporting success there is what made the old handler look like it worked
  // while silently doing nothing, or worse, doing something elsewhere.
  if (!data) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
