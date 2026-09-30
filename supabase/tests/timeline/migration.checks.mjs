import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createFixture, proposal, original, contract, asRequest, timeline, users } from './fixture.mjs';

const migration = await readFile(new URL(
  '../../migrations/20260930041641_harden_timeline_posts_identity_visibility.sql', import.meta.url,
), 'utf8');
const functionSql = (sql) => sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION'),
  sql.indexOf('$function$;') + '$function$;'.length);

test('deployable migration keeps the reviewed SQL body and contract', async () => {
  assert.equal(functionSql(migration), functionSql(proposal));
  const db = await createFixture();
  try {
    const before = await contract(db);
    await db.exec(migration);
    assert.deepEqual(await contract(db), before);
    assert.deepEqual(await asRequest(db, 'anon', null, () => timeline(db, users.a)), []);
    assert.deepEqual(await asRequest(db, 'authenticated', users.b,
      () => timeline(db, users.a)), []);
  } finally { await db.close(); }
});

test('deployable migration is idempotent on its exact hardened definition', async () => {
  const db = await createFixture();
  try {
    await db.exec(migration);
    const before = await contract(db);
    await db.exec(migration);
    assert.deepEqual(await contract(db), before);
    const rows = await asRequest(db, 'authenticated', users.a, () => timeline(db, users.a));
    assert.equal(rows.length, 9);
  } finally { await db.close(); }
});

test('deployable migration rejects unreviewed SQL drift', async () => {
  const db = await createFixture();
  try {
    await db.exec(original.replace('  WITH\n', '  -- independently changed\n  WITH\n') + ';');
    await assert.rejects(() => db.exec(migration), /Timeline definition changed since review/);
  } finally { await db.close(); }
});
