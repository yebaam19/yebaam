import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCommunityQuestions, getCommunityQuestion, getQuestionAnswers, getQuestionCategories, getQuestionCategory } from '@/features/communities/server/community-questions.server';
import { loadCommunityQuestions } from '@/features/communities/actions/questions/read.actions';
const mocks = vi.hoisted(() => ({ client: vi.fn(), from: vi.fn(), user: vi.fn(), permission: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: mocks.client }));
vi.mock('@/features/communities/server/profile-session.server', () => ({ requireProfileSession: mocks.permission }));
const id = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const createdAt = '2026-10-01T10:00:00Z';
function query(data: unknown, error: unknown = null) {
  return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), not: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(), textSearch: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve) };
}
beforeEach(() => { vi.resetAllMocks(); mocks.client.mockResolvedValue({ from: mocks.from, auth: { getUser: mocks.user } }); mocks.permission.mockResolvedValue({ ok: true }); });
describe('Question queries', () => {
  it('uses bounded keyset pages, indexed Spanish search and batched RLS author names', async () => {
    const q = query(Array.from({ length: 31 }, (_, i) => ({ id: i===29 ? other : id, author_id: id, created_at: createdAt })));
    const profiles = query([{ id, first_name: 'María', last_name: 'López', username: 'maria' }]);
    mocks.from.mockReturnValueOnce(q).mockReturnValue(profiles);
    const page = await getCommunityQuestions(JSON.stringify({ communityId: id, search: 'inscripciones', categoryId: other, cursor: { id, createdAt } }));
    expect(q.limit).toHaveBeenCalledWith(31); expect(q.eq).toHaveBeenCalledWith('community_id', id);
    expect(q.eq).toHaveBeenCalledWith('category_id', other); expect(q.is).toHaveBeenCalledWith('hidden_at', null);
    expect(q.textSearch).toHaveBeenCalledWith('search_vector', 'inscripciones', { type: 'websearch', config: 'spanish' });
    expect(q.or).toHaveBeenCalledWith(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`);
    expect(profiles.in).toHaveBeenCalledWith('id', [id]); expect(mocks.from).toHaveBeenCalledTimes(2);
    expect(page.items).toHaveLength(30); expect(page.items[0].author_name).toBe('María López');
    expect(page.nextCursor).toEqual({ id: other, createdAt });
  });
  it('derives mine from the verified user and retains access to their moderation feedback', async () => {
    const q = query([]); mocks.from.mockReturnValue(q); mocks.user.mockResolvedValue({ data: { user: { id: other } } });
    await getCommunityQuestions(JSON.stringify({ communityId: id, view: 'mine', authorId: id }));
    expect(q.eq).toHaveBeenCalledWith('author_id', other);
    expect(q.is).not.toHaveBeenCalledWith('hidden_at', null);
    mocks.user.mockResolvedValueOnce({ data: { user: null } });
    await expect(getCommunityQuestions(JSON.stringify({ communityId: id, view: 'mine' }))).rejects.toThrow('Inicia sesión');
  });
  it('requires moderation capability before loading the moderation queue', async () => {
    mocks.permission.mockResolvedValueOnce({ ok: false });
    expect(await loadCommunityQuestions({ communityId: id, view: 'moderation' })).toMatchObject({ ok: false });
    expect(mocks.from).not.toHaveBeenCalled();
    const q = query([]); mocks.from.mockReturnValue(q);
    await getCommunityQuestions(JSON.stringify({ communityId: id, view: 'moderation' }));
    expect(mocks.permission).toHaveBeenCalledWith(id, 'moderation');
    expect(q.not).toHaveBeenCalledWith('hidden_at', 'is', null);
  });
  it('handles missing rows and unavailable profiles without leaking alternate identities', async () => {
    mocks.from.mockReturnValue(query(null)); expect(await getCommunityQuestion(id, other)).toBeNull();
    const q = query({ id, author_id: other }); mocks.from.mockReturnValueOnce(q).mockReturnValue(query(null, { code: '42501' }));
    expect(await getCommunityQuestion(id, other)).toMatchObject({ author_name: null });
    expect(q.eq).toHaveBeenCalledWith('community_id', id);
    mocks.from.mockReturnValue(query(null, { code: '503' }));
    await expect(getCommunityQuestion(id, other)).rejects.toThrow('No se pudo cargar');
  });
  it('pages answers ascending within one question and excludes archived rows', async () => {
    const q = query(Array.from({ length: 31 }, () => ({ id, author_id: null, created_at: createdAt }))); mocks.from.mockReturnValue(q);
    const page = await getQuestionAnswers(id, other, JSON.stringify({ id, createdAt }));
    expect(q.eq.mock.calls).toEqual([['community_id', id], ['question_id', other]]);
    expect(q.is).toHaveBeenCalledWith('deleted_at', null);
    expect(q.order.mock.calls).toEqual([['created_at'], ['id']]);
    expect(q.or).toHaveBeenCalledWith(`created_at.gt.${createdAt},and(created_at.eq.${createdAt},id.gt.${id})`);
    expect(page.items).toHaveLength(30); expect(page.nextCursor).toEqual({ id, createdAt });
  });
  it('bounds ordered categories and supports a selected category outside the first page', async () => {
    const q = query(Array.from({ length: 31 }, (_, position) => ({ id, position }))); mocks.from.mockReturnValue(q);
    const page = await getQuestionCategories(id, JSON.stringify({ id, position: 5 }));
    expect(q.limit).toHaveBeenCalledWith(31);
    expect(q.or).toHaveBeenCalledWith(`position.gt.5,and(position.eq.5,id.gt.${id})`);
    expect(page.nextCursor).toEqual({ id, position: 29 });
    const selected = query({ id: other }); mocks.from.mockReturnValue(selected);
    expect(await getQuestionCategory(id, other)).toEqual({ id: other });
    expect(selected.eq).toHaveBeenCalledWith('id', other);
  });
  it('rejects injected cursor strings and invalid filters before querying', async () => {
    expect((await loadCommunityQuestions({ communityId: id, view: 'anything' })).ok).toBe(false);
    await expect(getQuestionAnswers(id, other, JSON.stringify({ id, createdAt: 'foo),id.gt.bar' }))).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
