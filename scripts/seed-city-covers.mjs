/**
 * One-shot seeder: pulls a curated lead image for each featured city from
 * Wikipedia, uploads it to Cloudflare Images, then writes the returned
 * `cf_image_id` into the `cities.cover_cf_image_id` column.
 *
 * Run with:
 *   pnpm dlx tsx scripts/seed-city-covers.mjs
 *
 * Idempotent: rows that already have a `cover_cf_image_id` are skipped, so
 * re-running won't duplicate uploads or burn Cloudflare quota.
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

if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env.local');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// Curated lead-image URLs (Wikimedia Commons, CC-licensed). Picked by hand so
// each cover actually shows the city — skylines / iconic landmarks, not flags
// or coats of arms.
const CITY_IMAGES = {
  bogota: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Bogota%2C_Colombia_%2836668708290%29.jpg',
  popayan: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Atardecer_en_Popay%C3%A1n%2C_Cauca.jpg',
  'buenos-aires':
    'https://upload.wikimedia.org/wikipedia/commons/1/1e/Puerto_Madero%2C_Buenos_Aires_%2840689219792%29_%28cropped%29.jpg',
  cali: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Santiago_de_Cali.jpg/3840px-Santiago_de_Cali.jpg',
  'ciudad-de-mexico':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg/3840px-Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg',
  lima: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Miraflores_2023.jpg/3840px-Miraflores_2023.jpg',
  medellin: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/El_Poblado_Medell%C3%ADn.jpg',
  santiago:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Palacio_de_La_Moneda_-_miguelreflex.jpg/3840px-Palacio_de_La_Moneda_-_miguelreflex.jpg',
};

async function uploadToCloudflareFromUrl(url, metadata) {
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
  console.log('Seeding Cloudflare covers for cities…');
  const { data: cities, error } = await sb
    .from('cities')
    .select('id, slug, name, cover_cf_image_id')
    .in('slug', Object.keys(CITY_IMAGES));
  if (error) throw error;
  console.log(`  ${cities.length} matching rows`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const city of cities) {
    if (city.cover_cf_image_id) {
      console.log(`  · ${city.slug}: already has cover (${city.cover_cf_image_id}) — skip`);
      skipped++;
      continue;
    }
    const src = CITY_IMAGES[city.slug];
    if (!src) {
      console.log(`  · ${city.slug}: no curated URL — skip`);
      skipped++;
      continue;
    }
    try {
      console.log(`  ↑ ${city.slug}: uploading…`);
      const result = await uploadToCloudflareFromUrl(src, {
        source: 'wikimedia-commons',
        city_slug: city.slug,
        city_name: city.name,
      });
      const cfId = result.id;
      const { error: updateErr } = await sb
        .from('cities')
        .update({ cover_cf_image_id: cfId })
        .eq('id', city.id);
      if (updateErr) throw updateErr;
      console.log(`  ✓ ${city.slug}: ${cfId}`);
      uploaded++;
    } catch (e) {
      console.error(`  ✗ ${city.slug}: ${e instanceof Error ? e.message : String(e)}`);
      failed++;
    }
  }

  console.log(`\nDone. uploaded=${uploaded} skipped=${skipped} failed=${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
