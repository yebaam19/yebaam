import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { createFixture, original, proposal, functionName, contract, asRequest,
  timeline, postNumbers, users } from './fixture.mjs';

test('baseline matches catalog fingerprint and reproduces flaws only on synthetic data', async () => {
  assert.equal(createHash('md5').update(original).digest('hex'), '88de1ed97716eeaef69c1f99c87720ec');
  const db = await createFixture();
  try {
    const rows = await asRequest(db, 'anon', null, () => timeline(db, users.a));
    assert.ok(postNumbers(rows).includes(3), 'baseline exposes requested user private post');
    assert.ok(postNumbers(rows).includes(13), 'baseline includes page wall');
    assert.ok(postNumbers(rows).includes(28), 'baseline includes unauthorized private business post');
  } finally { await db.close(); }
});

test('replacement preserves function identity, owner, ACL, defaults and all 17 return columns', async () => {
  const db = await createFixture();
  try {
    const before = await contract(db);
    await db.exec(proposal);
    assert.deepEqual(await contract(db), before);
    const columns = await asRequest(db, 'authenticated', users.a, async () =>
      (await db.query('SELECT * FROM public.get_timeline_posts($1, 1, 0)', [users.a])).fields.map((f) => f.name));
    assert.deepEqual(columns, ['id', 'author_id', 'content', 'background_color', 'media_files',
      'reactions_count', 'comments_count', 'privacy', 'is_reel', 'aspect_ratio', 'created_at',
      'updated_at', 'blog_id', 'business_id', 'business_name', 'business_slug', 'business_cf_image_id']);
    for (const role of ['anon', 'authenticated', 'service_role']) {
      const result = await db.query('SELECT has_function_privilege($1, $2, $3) AS allowed',
        [role, functionName, 'EXECUTE']);
      assert.equal(result.rows[0].allowed, true);
    }
  } finally { await db.close(); }
});

test('catalog drift guard stops the transaction rather than overwriting changed SQL', async () => {
  const db = await createFixture();
  try {
    await db.exec(original.replace('  WITH\n', '  -- independently changed\n  WITH\n') + ';');
    const changed = (await db.query('SELECT pg_get_functiondef($1::regprocedure) AS body', [functionName])).rows[0].body;
    await assert.rejects(() => db.exec(proposal), /Timeline definition changed since review/);
    await db.exec('ROLLBACK');
    assert.equal((await db.query('SELECT pg_get_functiondef($1::regprocedure) AS body', [functionName])).rows[0].body, changed);
  } finally { await db.close(); }
});

test('guard rejects an accidental second application and preserves hardened definition', async () => {
  const db = await createFixture();
  try {
    await db.exec(proposal);
    await assert.rejects(() => db.exec(proposal), /Timeline definition changed since review/);
    await db.exec('ROLLBACK');
    assert.deepEqual(await asRequest(db, 'anon', null, () => timeline(db, users.a)), []);
  } finally { await db.close(); }
});
