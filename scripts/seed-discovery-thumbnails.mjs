/**
 * One-shot seeder: uploads a generic stock photo per discovery category to
 * Cloudflare Images so the city detail page's "Explora <city>" grid has a
 * visual for each tile. Stores the returned image IDs in
 * `discovery_thumbnails` so the app reads them at runtime without baking IDs
 * into source.
 *
 * Run with:
 *   node scripts/seed-discovery-thumbnails.mjs
 *
 * Idempotent: categories that already have a thumbnail row are skipped.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local');
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    'Missing one of: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// Hand-picked stock photos (Wikimedia Commons) per category. Query strings
// stripped so Cloudflare doesn't choke on the URL fetch.
const CATEGORY_THUMBNAILS = {
  places: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Hodges_cape-good-hope.jpg',
  food: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Barbieri_-_ViaSophia25668.jpg',
  events:
    'https://upload.wikimedia.org/wikipedia/commons/6/6a/Holi_Festival_of_Colors_Utah%2C_United_States_2013.jpg',
  tourism:
    'https://upload.wikimedia.org/wikipedia/commons/c/c0/1_times_square_night_2013.jpg',
  nightlife: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Wikipedia_space_ibiza%2803%29.jpg',
  lodging: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/MadisonHotelFront.jpg',
  education:
    'https://upload.wikimedia.org/wikipedia/commons/4/4d/Columbia_University%2C_NYC_%28June_2014%29_-_09.JPG',
  commerce:
    'https://upload.wikimedia.org/wikipedia/commons/5/59/2018_Mall_of_America_01.jpg',
  history: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Museo_Naval_del_Caribe.JPG',
};

async function uploadFromUrl(url, metadata) {
  const form = new FormData();
  form.append('url', url);
  if (metadata) form.append('metadata', JSON.stringify(metadata));
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
      body: form,
    },
  );
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    const msg = body?.errors?.[0]?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body.result;
}

async function main() {
  console.log('Seeding Cloudflare discovery-category thumbnails…');

  // The thumbnails table is a tiny key/value: category text PK + cf_image_id.
  // Created on first run via the migration below.
  const { data: existing, error } = await sb
    .from('discovery_thumbnails')
    .select('category, cf_image_id');
  if (error) throw error;
  const seen = new Map(existing.map((r) => [r.category, r.cf_image_id]));

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [category, src] of Object.entries(CATEGORY_THUMBNAILS)) {
    if (seen.has(category)) {
      console.log(`  · ${category}: already has ${seen.get(category)} — skip`);
      skipped++;
      continue;
    }
    try {
      console.log(`  ↑ ${category}: uploading ${src}`);
      const result = await uploadFromUrl(src, { category, source: 'wikimedia-commons' });
      const { error: insertErr } = await sb
        .from('discovery_thumbnails')
        .insert({ category, cf_image_id: result.id });
      if (insertErr) throw insertErr;
      console.log(`  ✓ ${category}: ${result.id}`);
      uploaded++;
    } catch (e) {
      console.error(`  ✗ ${category}: ${e instanceof Error ? e.message : String(e)}`);
      failed++;
    }
  }

  console.log(`\nDone. uploaded=${uploaded} skipped=${skipped} failed=${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
