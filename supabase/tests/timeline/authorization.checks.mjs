import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createFixture, asRequest, timeline, postNumbers, users, business, proposal,
  uid, addPost } from './fixture.mjs';

let db;
before(async () => {
  db = await createFixture();
  await db.exec(proposal);
  console.log((await db.query('SELECT version()')).rows[0].version);
});
after(async () => { await db?.close(); });
const own = (operation) => asRequest(db, 'authenticated', users.a, operation);

test('signed-in timeline retains own posts, accepted friends and followed businesses', async () => {
  const rows = await own(() => timeline(db, users.a));
  assert.deepEqual(postNumbers(rows), [29, 27, 26, 10, 5, 4, 3, 2, 1]);
});

test('anonymous callers receive no personalized rows for any supplied identity', async () => {
  for (const requested of [users.a, users.b, null]) {
    assert.deepEqual(await asRequest(db, 'anon', null, () => timeline(db, requested)), []);
  }
});

test('signed-in users cannot request another user or a null identity', async () => {
  for (const requested of [users.b, users.c, null]) {
    assert.deepEqual(await own(() => timeline(db, requested)), []);
  }
});

test('missing subject and direct SQL without JWT context fail closed', async () => {
  assert.deepEqual(await asRequest(db, 'authenticated', null, () => timeline(db, users.a)), []);
  assert.deepEqual(await timeline(db, users.a), []);
});

test('user metadata cannot grant service-role authorization', async () => {
  const result = await asRequest(db, 'authenticated', users.c,
    () => timeline(db, users.a), { user_metadata: { role: 'service_role' } });
  assert.deepEqual(result, []);
});

test('private/friends-only visibility uses current relationships in both directions', async () => {
  const numbers = postNumbers(await own(() => timeline(db, users.a)));
  assert.ok(numbers.includes(5) && numbers.includes(10));
  for (const forbidden of [6, 7, 8, 9, 11, 12, 20, 21, 22, 28]) {
    assert.ok(!numbers.includes(forbidden), `post ${forbidden} must remain hidden`);
  }
});

test('ineligible business rows do not consume the three visible slots', async () => {
  const rows = (await own(() => timeline(db, users.a))).filter((row) => row.business_id);
  assert.deepEqual(postNumbers(rows), [29, 27, 26]);
  assert.ok(rows.every((row) => row.business_id === business.active));
  assert.ok(rows.every((row) => row.business_name === 'active'
    && row.business_slug === 'active' && row.business_cf_image_id === 'synthetic-image'));
});

test('blog and page walls are removed before business ranking and final pagination', async () => {
  const numbers = postNumbers(await own(() => timeline(db, users.a, 3)));
  assert.deepEqual(numbers, [29, 27, 26]);
  for (const forbidden of [13, 14, 15, 33, 34]) assert.ok(!numbers.includes(forbidden));
});

test('inactive, deleted and unfollowed businesses are absent', async () => {
  const numbers = postNumbers(await own(() => timeline(db, users.a)));
  for (const forbidden of [30, 31, 32]) assert.ok(!numbers.includes(forbidden));
});

test('SQL result is a subset of caller-visible post RLS', async () => {
  await own(async () => {
    const visible = new Set((await db.query('SELECT id FROM public.posts')).rows.map((r) => r.id));
    for (const row of await timeline(db, users.a)) assert.ok(visible.has(row.id));
  });
});

test('authenticated business joins work without direct comidas schema access', async () => {
  await own(async () => {
    assert.equal((await db.query("SELECT has_schema_privilege(current_user, 'comidas', 'USAGE') AS can_read")).rows[0].can_read, false);
    assert.equal((await timeline(db, users.a)).filter((row) => row.business_id).length, 3);
  });
});

test('trusted service-role JWT keeps server timeline behavior with wall exclusions', async () => {
  const rows = await asRequest(db, 'service_role', null, () => timeline(db, users.a));
  assert.deepEqual(postNumbers(rows), [28, 22, 21, 10, 5, 4, 3, 2, 1]);
});

test('revocation of a friendship immediately removes its friends-only content', async () => {
  await db.query("UPDATE public.friendships SET status = 'blocked' WHERE requester_id = $1 AND recipient_id = $2",
    [users.a, users.b]);
  try {
    const numbers = postNumbers(await own(() => timeline(db, users.a)));
    assert.ok(!numbers.includes(4) && !numbers.includes(5) && !numbers.includes(27));
    assert.deepEqual(numbers.slice(0, 3), [29, 26, 25]);
  } finally {
    await db.query("UPDATE public.friendships SET status = 'accepted' WHERE requester_id = $1 AND recipient_id = $2",
      [users.a, users.b]);
  }
});

test('paging is stable and offsets are applied after privacy filtering', async () => {
  await own(async () => {
    const first = await timeline(db, users.a, 3, 0);
    const second = await timeline(db, users.a, 3, 3);
    assert.deepEqual(postNumbers(first), [29, 27, 26]);
    assert.deepEqual(postNumbers(second), [10, 5, 4]);
    assert.deepEqual(await timeline(db, users.a, 3, 10000), []);
    assert.deepEqual(await timeline(db, users.a, 0), []);
    assert.deepEqual(await timeline(db, users.a, -1), []);
    assert.deepEqual(await timeline(db, users.a, 3, -10), first);
  });
});

test('equal timestamps have deterministic id ordering', async () => {
  for (const n of [50, 51]) await addPost(db, { n, author: users.a, rank: 300 });
  try {
    assert.deepEqual(postNumbers(await own(() => timeline(db, users.a, 2))), [51, 50]);
  } finally {
    await db.query('DELETE FROM public.posts WHERE id IN ($1, $2)', [uid(1050), uid(1051)]);
  }
});

test('null/default limits are 20, overlarge limits are 100, null offset is zero', async () => {
  for (let n = 100; n < 220; n++) await addPost(db, { n, author: users.a, rank: n });
  try {
    await own(async () => {
      assert.equal((await timeline(db, users.a, null, null)).length, 20);
      assert.equal((await db.query('SELECT * FROM public.get_timeline_posts($1)', [users.a])).rows.length, 20);
      assert.equal((await timeline(db, users.a, 2147483647)).length, 100);
    });
  } finally {
    await db.query('DELETE FROM public.posts WHERE id >= $1 AND id < $2', [uid(1100), uid(1220)]);
  }
});
