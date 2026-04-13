import { createClient } from 'npm:@insforge/sdk';

// NOTE on CORS: the InsForge edge gateway unconditionally stamps
// `Access-Control-Allow-Origin: *` on every response, overriding whatever
// the function returns. This means origin allowlisting cannot be enforced
// at the function layer. The security model for this endpoint does not
// rely on CORS — JWT validation + RLS enforce who can read what. Token
// auth via the `Authorization` header is non-credentialed in CORS terms,
// so `ACAO: *` is safe: a malicious site can only ever fetch data the
// caller is already publicly entitled to.
const cors = {
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  // Parse + validate input BEFORE hitting auth. Fail-fast on malformed
  // input avoids a needless JWT round-trip and makes the error path
  // observable without a real token.
  const url = new URL(req.url);

  const rawLimit = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 20;

  const cursor = url.searchParams.get('cursor');
  if (cursor !== null && (cursor === '' || Number.isNaN(Date.parse(cursor)))) {
    return jsonError(400, 'Invalid cursor');
  }

  const userToken = req.headers.get('Authorization')?.replace('Bearer ', '') ?? null;
  const client = createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
    edgeFunctionToken: userToken,
  });

  const { data: userData } = await client.auth.getCurrentUser();
  if (!userData?.user?.id) {
    return jsonError(401, 'Unauthorized');
  }

  let query = client.database
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

  const nextCursor = data && data.length === limit ? data[data.length - 1].created_at : null;

  return new Response(JSON.stringify({ posts: data ?? [], nextCursor }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
