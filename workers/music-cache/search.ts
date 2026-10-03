const MAX_BYTES = 512 * 1024;

export async function searchCache(request: Request) {
  const url = new URL(request.url);
  url.search = '';
  const key = new Request(url);
  if (request.method === 'GET') {
    const hit = await caches.default.match(key);
    return hit ?? new Response(null, { status: 404 });
  }
  if (request.method !== 'PUT') return new Response(null, { status: 405 });
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
    return new Response(null, { status: 415 });
  }
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) { await reader.cancel(); return new Response(null, { status: 413 }); }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  try { JSON.parse(new TextDecoder().decode(body)); }
  catch { return new Response(null, { status: 400 }); }
  await caches.default.put(key, new Response(body, {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
  }));
  return new Response(null, { status: 204 });
}
