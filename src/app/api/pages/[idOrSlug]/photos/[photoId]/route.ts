import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string; photoId: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { photoId } = await context.params;
  const client = await getServerClient();
  const { error } = await client.from('page_photos').delete().eq('id', photoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
