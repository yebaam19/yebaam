import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { resolvePage } from '@/lib/api/page-authz';
import { resolveImageRef } from '@/lib/media/urls';

/** Public list of active badge grants for a page (PDF §2). */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const { data, error } = await client
    .from('page_badge_grants')
    .select(
      `id, reason, awarded_at,
       badge:badges!page_badge_grants_badge_id_fkey(
         id, slug, name, description, icon_cf_image_id, tier
       )`
    )
    .eq('page_id', page.id)
    .is('revoked_at', null)
    .order('awarded_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const badges = ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const badge = row.badge as Record<string, unknown> | null;
    const iconId = badge?.icon_cf_image_id as string | null | undefined;
    return {
      grantId: row.id as string,
      reason: (row.reason as string | null) ?? null,
      awardedAt: row.awarded_at as string,
      badge: badge
        ? {
            id: badge.id as string,
            slug: badge.slug as string,
            name: badge.name as string,
            description: (badge.description as string | null) ?? null,
            tier: (badge.tier as string | null) ?? null,
            iconUrl: iconId ? resolveImageRef(iconId, 'avatar') : null,
          }
        : null,
    };
  });

  return NextResponse.json({ badges });
}
