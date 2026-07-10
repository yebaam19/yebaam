import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { resolvePage } from '@/lib/api/page-authz';
import { loadPageContext, mapPage, type PageRow } from '@/lib/api/pages';

/** Páginas relacionadas por categoría + ciudad + popularidad (PDF §7). */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;

  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const { data: self } = await client
    .from('pages')
    .select('id,category,contact,privacy')
    .eq('id', page.id)
    .maybeSingle();

  if (!self) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const category = (self as { category?: string }).category;
  const contact = (self as { contact?: { address?: { city?: string; country?: string } } }).contact;
  const city = contact?.address?.city;

  let query = client
    .from('pages')
    .select('*')
    .neq('id', page.id)
    .eq('privacy', 'public')
    .order('follower_count', { ascending: false })
    .limit(12);

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let rows = (data ?? []) as PageRow[];

  // Prefer same city when available (contact JSON filter is best-effort client-side).
  if (city) {
    const sameCity = rows.filter((r) => {
      const c = (r.contact as { address?: { city?: string } } | null)?.address?.city;
      return c && c.toLowerCase() === city.toLowerCase();
    });
    if (sameCity.length >= 3) rows = sameCity;
  }

  const ctx = await loadPageContext(client, rows, viewerId);
  return NextResponse.json(rows.map((r) => mapPage(r, ctx)));
}
