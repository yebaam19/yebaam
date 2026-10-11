import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/proxy';

const state = vi.hoisted(() => ({
  user: { id: 'viewer' } as { id: string } | null,
  roles: new Set<string>(),
  failedTables: new Set<string>(),
  lookups: [] as Array<{ table: string; column: string; value: string }>,
  claimsError: null as null | { code: string },
  clearCookies: vi.fn(),
}));

vi.mock('@/utils/supabase/claims', () => ({
  getAuthClaimsUser: () => Promise.resolve({ user: state.user, error: state.claimsError }),
}));
vi.mock('@/utils/supabase/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/supabase/middleware')>();
  return {
    ...actual,
    createClient: () => {
      const response = NextResponse.next();
      response.cookies.set('sb-refresh-test', 'rotated', { httpOnly: true });
      return {
        supabaseResponse: response,
        clearAuthCookies: state.clearCookies,
        supabase: {
          from: (table: string) => ({
            select: () => ({
              eq: (column: string, value: string) => {
                state.lookups.push({ table, column, value });
                return { maybeSingle: async () => ({
                  data: state.failedTables.has(table) ? null : state.roles.has(table) ? { user_id: value } : null,
                  error: state.failedTables.has(table) ? { message: 'unavailable' } : null,
                }) };
              },
            }),
          }),
        },
      };
    },
  };
});

const platform = 'platform_admins';
const forum = 'forum_global_roles';
const music = 'music_archive_editors';
const roles = [
  { name: 'regular user', tables: [], feed: null, login: '/feed', admin: '/feed', music: '/feed' },
  { name: 'platform admin', tables: [platform], feed: '/admin/foros', login: '/admin/foros', admin: null, music: null },
  { name: 'forum moderator', tables: [forum], feed: null, login: '/feed', admin: null, music: null },
  { name: 'music editor', tables: [music], feed: null, login: '/feed', admin: '/admin/music', music: null },
  { name: 'forum and music', tables: [forum, music], feed: null, login: '/feed', admin: null, music: null },
  { name: 'platform and forum', tables: [platform, forum], feed: '/admin/foros', login: '/admin/foros', admin: null, music: null },
  { name: 'platform and music', tables: [platform, music], feed: '/admin/foros', login: '/admin/foros', admin: null, music: null },
  { name: 'all roles', tables: [platform, forum, music], feed: '/admin/foros', login: '/admin/foros', admin: null, music: null },
];

const visit = (path: string) => proxy(new NextRequest(`http://localhost:3000${path}`));
function expectDestination(response: NextResponse, destination: string | null) {
  expect(response.status).toBe(destination ? 307 : 200);
  expect(response.headers.get('location')).toBe(destination ? `http://localhost:3000${destination}` : null);
  expect(response.cookies.get('sb-refresh-test')?.value).toBe('rotated');
}

beforeEach(() => {
  state.user = { id: 'viewer' };
  state.roles.clear();
  state.failedTables.clear();
  state.lookups = [];
  state.claimsError = null;
  state.clearCookies.mockClear();
});

describe.each(roles)('$name: permission routing', (role) => {
  beforeEach(() => { state.roles = new Set(role.tables); });
  it.each([
    ['/feed', role.feed], ['/cities/popayan/news', role.feed],
    ['/login', role.login], ['/admin', role.admin], ['/admin/foros', role.admin],
    ['/admin/music', role.music], ['/admin/music/tracks', role.music],
    ['/admin/music-other', role.admin], ['/administrator', role.feed],
    ['/comunidades', null], ['/chat-publico/general', null], ['/musica', null],
    ['/feed?adminView=1', null], ['/admin/foros?adminView=1', role.admin],
  ])('%s preserves destination %s and refreshed cookies', async (path, destination) => {
    expectDestination(await visit(path!), destination);
    expect(state.lookups.every(({ column, value }) => column === 'user_id' && value === 'viewer')).toBe(true);
  });
});

describe('query budget and fresh permissions', () => {
  it.each([
    ['/', []], ['/comunidades', []], ['/comunidades/example', []], ['/chat-publico/general', []],
    ['/feed', [platform]], ['/friends', [platform]], ['/login', [platform]],
    ['/cities/popayan/news', [platform]], ['/comunidades-private', [platform]],
    ['/admin/foros', [platform, forum, music]], ['/admin/music', [platform, forum, music]],
  ] as Array<[string, string[]]>)('%s reads only the roles needed for routing', async (path, tables) => {
    await visit(path);
    expect(state.lookups.map(({ table }) => table)).toEqual(tables);
  });

  it.each(['/feed', '/admin/music', '/comunidades'])('visitors read no role tables: %s', async (path) => {
    state.user = null;
    const response = await visit(path);
    expect(response.status).toBe(path === '/comunidades' ? 200 : 307);
    expect(state.lookups).toEqual([]);
  });

  it('rechecks revoked privileges on the next request', async () => {
    state.roles.add(music);
    expectDestination(await visit('/admin/music'), null);
    state.roles.clear();
    expectDestination(await visit('/admin/music'), '/feed');
    expect(state.lookups).toHaveLength(6);
  });

  it('does not grant admin access when role reads fail', async () => {
    state.roles = new Set([platform, forum, music]);
    state.failedTables = new Set(state.roles);
    expectDestination(await visit('/admin/music'), '/feed');
  });

  it('does not trust adminView for an ordinary caller', async () => {
    expectDestination(await visit('/admin/music?adminView=1'), '/feed');
  });

  it('clears invalid refresh cookies and treats the request as anonymous', async () => {
    state.claimsError = { code: 'invalid_refresh_token' };
    expectDestination(await visit('/feed'), '/login?redirect=%2Ffeed');
    expect(state.clearCookies).toHaveBeenCalledOnce();
    expect(state.lookups).toEqual([]);
  });
});
