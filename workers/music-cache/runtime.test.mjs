import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { signMusicCache } from '../../src/lib/cloudflare/music-cache-signature.ts';

const secret = 'local-runtime-test-secret-at-least-32-characters';
let worker;
let bucket;
async function signed(path, method = 'GET', ttl = 3600) {
  const expires = Math.floor(Date.now() / 1000) + ttl;
  const signature = await signMusicCache(secret, method, path, expires);
  return `https://music.example.test${path}?expires=${expires}&signature=${signature}`;
}
before(async () => {
  worker = new Miniflare(convertV4MiniflareOptions({ workers: [{ name: 'music-cache', modules: true,
    scriptPath: 'workers/music-cache/.wrangler/music-cache-build/index.js', compatibilityDate: '2026-10-03',
    r2Buckets: ['MUSIC'], bindings: { MUSIC_CACHE_SECRET: secret } }] }));
  bucket = await worker.getR2Bucket('MUSIC');
  await bucket.put('songs/test.mp3', '0123456789', { httpMetadata: { contentType: 'audio/mpeg' } });
});
after(async () => { await worker?.dispose(); });

test('streams audio and caches it, while rejecting expired or tampered access even after a cache hit', async () => {
  const url = await signed('/audio/v1/songs%2Ftest.mp3');
  let response = await worker.dispatchFetch(url);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Music-Cache'), 'MISS');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(await response.text(), '0123456789');
  // A subsequent request can race the asynchronous fill: inspect the actual cache handle.
  const cache = await worker.getCaches();
  const key = 'https://music.example.test/audio/v1/songs%2Ftest.mp3';
  for (let i = 0; i < 30 && !await cache.default.match(key); i++) {
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  response = await worker.dispatchFetch(url, { headers: { Range: 'bytes=2-5' } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('X-Music-Cache'), 'HIT');
  assert.equal(response.headers.get('Content-Range'), 'bytes 2-5/10');
  assert.equal(await response.text(), '2345');
  response = await worker.dispatchFetch(await signed('/audio/v1/songs%2Ftest.mp3', 'GET', -1));
  assert.equal(response.status, 403);
  response = await worker.dispatchFetch(url.replace('test.mp3', 'private.pdf'));
  assert.equal(response.status, 403);
  response = await worker.dispatchFetch(key);
  assert.equal(response.status, 403);
});

test('supports uncached suffix ranges, HEAD and unsatisfiable ranges', async () => {
  await bucket.put('other.mp3', 'abcdefghij', { httpMetadata: { contentType: 'audio/mpeg' } });
  const url = await signed('/audio/v1/other.mp3');
  let response = await worker.dispatchFetch(url, { headers: { Range: 'bytes=-3' } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('Content-Length'), '3');
  assert.equal(await response.text(), 'hij');
  response = await worker.dispatchFetch(url, { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Length'), '10');
  assert.equal(await response.text(), '');
  response = await worker.dispatchFetch(url, { headers: { Range: 'bytes=20-30' } });
  assert.equal(response.status, 416);
});

test('stores bounded search JSON only with a server signature; reads are private and method-bound', async () => {
  const path = `/search/v1/${'a'.repeat(64)}`;
  const body = JSON.stringify({ artists: [], albums: [{ title: 'Bolero' }], tracks: [] });
  let response = await worker.dispatchFetch(await signed(path, 'PUT', 60), {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body,
  });
  assert.equal(response.status, 204);
  response = await worker.dispatchFetch(await signed(path, 'GET', 60));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(await response.text(), body);
  response = await worker.dispatchFetch(await signed(path, 'GET', 60), { method: 'PUT', body });
  assert.equal(response.status, 403);
  response = await worker.dispatchFetch(await signed(path, 'PUT', 60), {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(524289),
  });
  assert.equal(response.status, 413);
  response = await worker.dispatchFetch(await signed(`/search/v1/${'b'.repeat(64)}`, 'GET', 60));
  assert.equal(response.status, 404);
});
