import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';
import { checkRateLimit, clientIp } from '@/lib/api/rate-limit';

type ProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const limit = checkRateLimit(`search:users:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: Math.ceil((limit.resetAt - Date.now()) / 1000) },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  const max = Math.min(Math.max(Number(searchParams.get('limit') ?? '8') || 8, 1), 20);

  if (q.length < 2) {
    return NextResponse.json(
      { results: [], query: q },
      {
        headers: {
          'Cache-Control': 'private, max-age=30',
          'X-RateLimit-Remaining': String(limit.remaining),
        },
      }
    );
  }

  const client = await getServerClient();
  const escaped = q.replace(/[\\%_]/g, '\\$&');
  const pattern = `%${escaped}%`;

  const { data, error } = await client.database
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url,bio')
    .or(`username.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`)
    .limit(max);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = ((data ?? []) as ProfileRow[]).map((row) => {
    const fullName =
      [row.first_name, row.last_name].filter(Boolean).join(' ') || row.username || '';
    return {
      id: row.id,
      username: row.username ?? '',
      fullName,
      avatarUrl: row.avatar_url ?? null,
      bio: row.bio ?? null,
    };
  });

  return NextResponse.json(
    { results, query: q },
    {
      headers: {
        'Cache-Control': 'private, max-age=30',
        'X-RateLimit-Remaining': String(limit.remaining),
      },
    }
  );
}
