import { readFile } from 'node:fs/promises';

const { PGlite } = process.env.TIMELINE_TEST_PG === '17'
  ? await import('pglite-pg17') : await import('@electric-sql/pglite');

export const uid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
export const users = { a: uid(1), b: uid(2), c: uid(3), d: uid(4), e: uid(5), f: uid(6) };
export const business = { active: uid(800), inactive: uid(801), deleted: uid(802), unfollowed: uid(803) };
const security = new URL('../../../docs/security/timeline/', import.meta.url);
export const original = await readFile(new URL('original.catalog.txt', security), 'utf8');
export const proposal = await readFile(new URL('hardening.proposed.sql', security), 'utf8');
export const functionName = 'public.get_timeline_posts(uuid,integer,integer)';

export async function createFixture() {
  // No URL, credentials, file path, sockets, or production database connection.
  const db = new PGlite();
  await db.exec(await readFile(new URL('schema.sql', import.meta.url), 'utf8'));
  await db.exec(`${original};`);
  await db.exec(`GRANT EXECUTE ON FUNCTION ${functionName} TO anon, authenticated, service_role`);
  const { a, b, c, d, e, f } = users;
  await db.query(`INSERT INTO public.friendships VALUES
    ($1, $2, 'accepted'), ($3, $1, 'accepted'),
    ($1, $4, 'pending'), ($1, $5, 'blocked')`, [a, b, d, e, f]);
  for (const [name, id] of Object.entries(business)) {
    await db.query(`INSERT INTO comidas.businesses VALUES ($1, $2, $2, 'synthetic-image', $3, $4)`,
      [id, name, name !== 'inactive', name === 'deleted' ? '2026-01-01T00:00:00Z' : null]);
    if (name !== 'unfollowed') {
      await db.query('INSERT INTO comidas.business_follows VALUES ($1, $2)', [a, id]);
    }
  }
  for (const [i, author] of [a, b, c].entries()) {
    for (const [j, privacy] of ['public', 'friends', 'private'].entries()) {
      await addPost(db, { n: i * 3 + j + 1, author, privacy });
    }
  }
  await addPost(db, { n: 10, author: d, privacy: 'friends' });
  await addPost(db, { n: 11, author: e, privacy: 'friends' });
  await addPost(db, { n: 12, author: f, privacy: 'friends' });
  await addPost(db, { n: 13, author: a, page: uid(900) });
  await addPost(db, { n: 14, author: b, page: uid(900) });
  await addPost(db, { n: 15, author: a, blog: uid(901) });
  // The newest three business posts are private to an unrelated author.
  for (let n = 20; n <= 22; n++) {
    await addPost(db, { n, author: c, privacy: 'private', biz: business.active, rank: 100 + n });
  }
  for (let n = 23; n <= 26; n++) {
    await addPost(db, { n, author: c, biz: business.active });
  }
  await addPost(db, { n: 27, author: b, privacy: 'friends', biz: business.active });
  await addPost(db, { n: 28, author: b, privacy: 'private', biz: business.active, rank: 128 });
  await addPost(db, { n: 29, author: a, privacy: 'private', biz: business.active });
  await addPost(db, { n: 30, author: c, biz: business.inactive });
  await addPost(db, { n: 31, author: c, biz: business.deleted });
  await addPost(db, { n: 32, author: c, biz: business.unfollowed });
  await addPost(db, { n: 33, author: a, biz: business.active, page: uid(900), rank: 200 });
  await addPost(db, { n: 34, author: a, biz: business.active, blog: uid(901), rank: 201 });
  return db;
}

export async function addPost(db, { n, author, privacy = 'public', biz = null,
  blog = null, page = null, rank = n }) {
  await db.query(`INSERT INTO public.posts VALUES (
    $1, $2, $3, '#ffffff', '[{"id":"synthetic-media"}]'::jsonb,
    '{"like":1}'::jsonb, 2, $4, false, '1:1', $5, $5, $6, $7, $8
  )`, [uid(1000 + n), author, `synthetic post ${n}`, privacy,
    new Date(Date.UTC(2026, 0, 1, 0, rank)).toISOString(), blog, biz, page]);
}

export async function asRequest(db, role, actor, operation, claimsOverride = {}) {
  if (!['anon', 'authenticated', 'service_role'].includes(role)) throw new Error('Unknown test role');
  await db.exec('BEGIN');
  try {
    await db.exec(`SET LOCAL ROLE ${role}`);
    await db.query(`SELECT set_config('request.jwt.claims', $1, true)`,
      [JSON.stringify({ role, ...(actor ? { sub: actor } : {}), ...claimsOverride })]);
    return await operation();
  } finally {
    await db.exec('ROLLBACK');
  }
}

export const timeline = async (db, requested, limit = 100, offset = 0) =>
  (await db.query('SELECT * FROM public.get_timeline_posts($1, $2, $3)', [requested, limit, offset])).rows;
export const postNumbers = (rows) => rows.map((row) => Number(row.id.slice(-12)) - 1000);
export async function contract(db) {
  return (await db.query(`SELECT oid, proname, proargtypes::text, proallargtypes::text,
    proargnames, proargmodes, pg_get_expr(proargdefaults, 0) AS defaults,
    prorettype::text, proretset, prolang, provolatile, prosecdef, proconfig,
    proowner, proacl::text FROM pg_proc WHERE oid = $1::regprocedure`, [functionName])).rows[0];
}
