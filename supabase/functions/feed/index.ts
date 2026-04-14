// Paginated feed of posts with author join.
//
// Uses the caller's JWT so RLS on `posts` (privacy = public / friends /
// private) naturally filters what they can see. The cursor is the
// created_at timestamp of the oldest visible row from the previous page.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);

  const rawLimit = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 20;

  const cursor = url.searchParams.get('cursor');
  if (cursor !== null && (cursor === '' || Number.isNaN(Date.parse(cursor)))) {
    return jsonError(400, 'Invalid cursor');
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonError(401, 'Unauthorized');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[feed] SUPABASE_URL or SUPABASE_ANON_KEY missing');
    return jsonError(500, 'Server misconfigured');
  }

  // Client bound to the caller's JWT — RLS policies on `posts` decide
  // what this user can see. We don't need a separate getUser() call:
  // the query will return an empty set (or RLS-filtered rows) for
  // whoever owns the token.
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: authErr } = await client.auth.getUser();
  if (authErr || !userData?.user?.id) {
    return jsonError(401, 'Unauthorized');
  }

  let query = client
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(id,username,display_name,avatar_url)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const rows = data ?? [];
  const nextCursor =
    rows.length === limit ? (rows[rows.length - 1] as { created_at: string }).created_at : null;

  return new Response(JSON.stringify({ posts: rows, nextCursor }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
