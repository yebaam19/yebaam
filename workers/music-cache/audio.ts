const CACHE_SECONDS = 3600;
const MAX_CACHE_BYTES = 100 * 1024 * 1024;

function headersFor(object: R2Object) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Content-Length', String(object.size));
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
  return headers;
}

function rangeOf(value: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return Number.isSafeInteger(start) && Number.isSafeInteger(end) && start >= 0 && start <= end && start < size
    ? { offset: start, length: end - start + 1 } : null;
}

export async function serveAudio(request: Request, env: MusicCacheEnv, ctx: ExecutionContext) {
  const url = new URL(request.url);
  const objectKey = decodeURIComponent(url.pathname.slice('/audio/v1/'.length));
  if (!objectKey || objectKey.length > 1024) return new Response('Bad key', { status: 400 });
  url.search = '';
  const cacheKey = new Request(url, { headers: request.headers.has('Range')
    ? { Range: request.headers.get('Range')! } : undefined });
  const cached = await caches.default.match(cacheKey);
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set('X-Music-Cache', 'HIT');
    return new Response(cached.body, { status: cached.status, headers });
  }
  const meta = await env.MUSIC.head(objectKey);
  if (!meta) return new Response('Not found', { status: 404 });
  const headers = headersFor(meta);
  headers.set('X-Music-Cache', 'MISS');
  if (request.method === 'HEAD') return new Response(null, { headers });
  const rangeHeader = request.headers.get('Range');
  const range = rangeHeader ? rangeOf(rangeHeader, meta.size) : undefined;
  if (rangeHeader && !range) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${meta.size}` } });
  }
  const object = await env.MUSIC.get(objectKey, { range: range ?? undefined, onlyIf: { etagMatches: meta.etag } });
  if (!object || !('body' in object)) return new Response('Retry', { status: 503 });
  if (range) {
    headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${meta.size}`);
    headers.set('Content-Length', String(range.length));
  }
  const response = new Response(object.body, { status: range ? 206 : 200, headers });
  if (meta.size <= MAX_CACHE_BYTES) {
    // Separate streams keep a slow listener from buffering the cache's tee in RAM.
    ctx.waitUntil((async () => {
      const full = await env.MUSIC.get(objectKey, { onlyIf: { etagMatches: meta.etag } });
      if (full && 'body' in full) {
        await caches.default.put(new Request(url), new Response(full.body, { headers: headersFor(full) }));
      }
    })().catch(() => console.error(JSON.stringify({ event: 'audio_cache_fill_failed' }))));
  }
  return response;
}
