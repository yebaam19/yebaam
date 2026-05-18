/**
 * One-shot seeder: fetches population / altitude / founding year /
 * administrative region for each featured city from Wikidata, then writes
 * the values into the `cities` table.
 *
 * Run with:
 *   node scripts/seed-city-facts.mjs
 *
 * Idempotent: rows that already have all 4 facts are skipped. Use
 *   FORCE=1 node scripts/seed-city-facts.mjs
 * to refresh values that have already been written.
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// Hardcoded slug → Wikidata QID map. Adding a new featured city = add a row
// here and re-run. Verified against wikidata.org search — there are several
// US namesakes (Cali, Medellín) that collide on the obvious QIDs; these are
// the Colombian/Latin-American canonical entities.
const CITY_QIDS = {
  bogota: 'Q2841',
  popayan: 'Q335135',
  'buenos-aires': 'Q1486',
  cali: 'Q51103',
  'ciudad-de-mexico': 'Q1489',
  lima: 'Q2868',
  medellin: 'Q48278',
  santiago: 'Q2887',
};

// Department-label overrides — applied AFTER Wikidata so we don't fight the
// P131 chain in cases where the auto-resolved label reads oddly. Buenos
// Aires's P131 walks straight to "Argentina" because CABA is autonomous;
// Mexico City's lands on imperial-era labels. Override to the colloquial
// department/state the user actually thinks in.
const DEPARTMENT_OVERRIDES = {
  'buenos-aires': 'Ciudad Autónoma',
  'ciudad-de-mexico': 'Ciudad de México',
};

async function getEntity(qid) {
  const res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, {
    headers: { 'User-Agent': 'yebaam-city-seeder/1.0 (https://yebaam.com)' },
  });
  if (!res.ok) throw new Error(`Wikidata ${res.status} for ${qid}`);
  const body = await res.json();
  return body?.entities?.[qid];
}

/** Find the highest-precision (most recent) statement for a quantity property
 *  and return its numeric value (parsed from Wikidata's "+12345" amount string). */
function pickMostRecentQuantity(entity, prop) {
  const claims = entity?.claims?.[prop];
  if (!claims || claims.length === 0) return null;
  // Sort by point-in-time qualifier desc, falling back to the claim order.
  const ranked = [...claims].sort((a, b) => {
    const pa = a.qualifiers?.P585?.[0]?.datavalue?.value?.time ?? '';
    const pb = b.qualifiers?.P585?.[0]?.datavalue?.value?.time ?? '';
    return pb.localeCompare(pa);
  });
  for (const claim of ranked) {
    const amount = claim?.mainsnak?.datavalue?.value?.amount;
    if (!amount) continue;
    const n = Number(amount);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
}

/** Inception (P571): take the earliest year out of any time claim. */
function pickEarliestYear(entity, prop) {
  const claims = entity?.claims?.[prop];
  if (!claims || claims.length === 0) return null;
  let earliest = null;
  for (const claim of claims) {
    const time = claim?.mainsnak?.datavalue?.value?.time;
    if (!time) continue;
    // Format: "+1537-01-13T00:00:00Z" or "-0044-00-00T00:00:00Z" for BC.
    const match = time.match(/^([+-]?)(\d{1,5})/);
    if (!match) continue;
    const sign = match[1] === '-' ? -1 : 1;
    const year = sign * Number(match[2]);
    if (earliest === null || year < earliest) earliest = year;
  }
  return earliest;
}

/** Resolve P131 (located in admin region) → that region's Spanish label. */
async function resolveAdminRegionLabel(entity) {
  const claims = entity?.claims?.P131;
  if (!claims || claims.length === 0) return null;
  // First P131 is usually the most direct parent admin region.
  for (const claim of claims) {
    const targetQid = claim?.mainsnak?.datavalue?.value?.id;
    if (!targetQid) continue;
    try {
      const region = await getEntity(targetQid);
      return region?.labels?.es?.value ?? region?.labels?.en?.value ?? null;
    } catch {
      // Try the next P131 claim.
    }
  }
  return null;
}

async function extractFacts(qid) {
  const entity = await getEntity(qid);
  const [population, altitude, foundedYear, department] = await Promise.all([
    Promise.resolve(pickMostRecentQuantity(entity, 'P1082')),
    Promise.resolve(pickMostRecentQuantity(entity, 'P2044')),
    Promise.resolve(pickEarliestYear(entity, 'P571')),
    resolveAdminRegionLabel(entity),
  ]);
  return { population, altitudeM: altitude, foundedYear, department };
}

async function main() {
  console.log('Seeding city facts from Wikidata…');
  const force = process.env.FORCE === '1';
  const { data: cities, error } = await sb
    .from('cities')
    .select('id, slug, name, population, altitude_m, founded_year, department')
    .in('slug', Object.keys(CITY_QIDS));
  if (error) throw error;
  console.log(`  ${cities.length} matching rows`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const city of cities) {
    const allSet =
      city.population !== null &&
      city.altitude_m !== null &&
      city.founded_year !== null &&
      city.department !== null;
    if (allSet && !force) {
      console.log(`  · ${city.slug}: already has all 4 facts — skip`);
      skipped++;
      continue;
    }
    const qid = CITY_QIDS[city.slug];
    try {
      console.log(`  ? ${city.slug} → ${qid}: fetching…`);
      const facts = await extractFacts(qid);
      if (DEPARTMENT_OVERRIDES[city.slug]) {
        facts.department = DEPARTMENT_OVERRIDES[city.slug];
      }
      console.log(
        `     pop=${facts.population} altM=${facts.altitudeM} founded=${facts.foundedYear} dept=${facts.department}`,
      );
      const { error: updateErr } = await sb
        .from('cities')
        .update({
          population: facts.population,
          altitude_m: facts.altitudeM,
          founded_year: facts.foundedYear,
          department: facts.department,
        })
        .eq('id', city.id);
      if (updateErr) throw updateErr;
      console.log(`  ✓ ${city.slug}`);
      updated++;
    } catch (e) {
      console.error(`  ✗ ${city.slug}: ${e instanceof Error ? e.message : String(e)}`);
      failed++;
    }
  }

  console.log(`\nDone. updated=${updated} skipped=${skipped} failed=${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
