import { verifyMusicCache } from '../../src/lib/cloudflare/music-cache-signature';
import { serveAudio } from './audio';
import { searchCache } from './search';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method === 'HEAD' ? 'GET' : request.method;
    try {
      // Never put the signature check behind a shared CDN cache.
      if (!await verifyMusicCache(env.MUSIC_CACHE_SECRET, method, url)) {
        return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'no-store' } });
      }
      let response: Response;
      if (url.pathname.startsWith('/audio/v1/') && method === 'GET') {
        response = await serveAudio(request, env, ctx);
      } else if (/^\/search\/v1\/[a-f0-9]{64}$/.test(url.pathname)) {
        response = await searchCache(request);
      } else response = new Response('Not found', { status: 404 });
      // Only the explicit internal cache may reuse private responses.
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'private, no-store');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Referrer-Policy', 'no-referrer');
      return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, headers });
    } catch {
      console.error(JSON.stringify({ event: 'music_cache_failed', kind: url.pathname.startsWith('/audio/') ? 'audio' : 'search' }));
      return new Response('Temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  },
} satisfies ExportedHandler<MusicCacheEnv>;
