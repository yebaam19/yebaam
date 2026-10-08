import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCommunityQuestion, saveQuestionAnswer, saveQuestionCategory, changeCommunityQuestion, changeQuestionAnswer } from '@/features/communities/actions/questions/write.actions';
import { questionQuerySchema, questionSchema } from '@/features/communities/schemas/communityQuestion.schema';
const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/features/communities/actions/_shared', () => ({ requireSession: mocks.session }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
const id = '11111111-1111-4111-8111-111111111111';
const communityId = '22222222-2222-4222-8222-222222222222';
const input = { id, communityId, expectedVersion: 0, title: ' Pregunta ', body: ' Texto ' };
beforeEach(() => {
  vi.resetAllMocks(); mocks.session.mockResolvedValue({ userId: id, client: { rpc: mocks.rpc } });
  mocks.rpc.mockResolvedValue({ data: { id, version: 1 }, error: null });
});
describe('Questions server actions', () => {
  it('defaults correspondence to private and never forwards a supplied author or official flag', async () => {
    expect(await saveCommunityQuestion({ ...input, authorId: communityId, isOfficial: true })).toEqual({ ok: true, data: { id, version: 1 } });
    expect(mocks.rpc).toHaveBeenCalledWith('save_community_question', {
      target_community: communityId, target_id: id, expected_version: 0, question_title: 'Pregunta', question_body: 'Texto', target_category: null, published: false,
    });
    expect(mocks.revalidate).toHaveBeenCalledWith('/feed/comunidades/[slug]', 'layout');
  });
  it('rejects invalid input before opening a verified session', async () => {
    for (const patch of [{ title: '' }, { body: 'x'.repeat(6001) }, { id: 'bad' }, { expectedVersion: -1 }, { isPublished: 'true' }]) {
      expect((await saveCommunityQuestion({ ...input, ...patch })).ok).toBe(false);
    }
    expect(mocks.session).not.toHaveBeenCalled();
    expect(questionSchema.parse(input).isPublished).toBe(false);
    expect(questionQuerySchema.safeParse({ communityId, cursor: { id, createdAt: '2026),id.gt.any' } }).success).toBe(false);
    expect(questionQuerySchema.safeParse({ communityId, search: 'x'.repeat(161) }).success).toBe(false);
  });
  it('fails closed without verified authentication or after permission revocation', async () => {
    mocks.session.mockResolvedValueOnce(null);
    expect((await saveQuestionAnswer({ ...input, questionId: id })).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '42501' } });
    expect(await saveQuestionAnswer({ ...input, questionId: id })).toMatchObject({ ok: false, error: expect.stringContaining('permiso') });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('passes answer publication opt-in and stable expected versions to the locked RPC', async () => {
    await saveQuestionAnswer({ ...input, questionId: id, expectedVersion: 3, isPublished: true });
    expect(mocks.rpc).toHaveBeenCalledWith('save_community_question_answer', {
      target_community: communityId, target_question: id, target_id: id, expected_version: 3, answer_body: 'Texto', published: true,
    });
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '40001' } });
    expect(await saveCommunityQuestion(input)).toMatchObject({ ok: false, error: expect.stringContaining('cambió') });
  });
  it('requires reason and confirmation for moderation and confirmation for archive', async () => {
    for (const patch of [{ operation: 'hide', confirmed: true }, { operation: 'hide', reason: 'Phishing' }, { operation: 'archive' }]) {
      expect((await changeCommunityQuestion({ communityId, id, expectedVersion: 1, ...patch })).ok).toBe(false);
    }
    expect(mocks.rpc).not.toHaveBeenCalled();
    await changeCommunityQuestion({ communityId, id, expectedVersion: 1, operation: 'hide', reason: ' Phishing ', confirmed: true });
    expect(mocks.rpc).toHaveBeenCalledWith('change_community_question', expect.objectContaining({ reason: 'Phishing', operation: 'hide', confirmed: true, expected_version: 1 }));
    await changeQuestionAnswer({ communityId, questionId: communityId, id, expectedVersion: 2, operation: 'archive', confirmed: true });
    expect(mocks.rpc).toHaveBeenLastCalledWith('change_community_question_answer', expect.objectContaining({ target_question: communityId, operation: 'archive', confirmed: true }));
  });
  it('requires explicit category archival and explains nonempty-category failure', async () => {
    expect((await saveQuestionCategory({ ...input, position: 0, archive: true })).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '23503' } });
    expect(await saveQuestionCategory({ ...input, expectedVersion: 2, position: 0, archive: true, confirmed: true })).toMatchObject({ ok: false, error: expect.stringContaining('Mueve las preguntas') });
  });
  it('does not retry non-idempotent failures or accept malformed success payloads', async () => {
    mocks.rpc.mockRejectedValueOnce(new Error('Network'));
    expect((await saveCommunityQuestion(input)).ok).toBe(false);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    mocks.rpc.mockResolvedValueOnce({ data: { id, version: 'bad' }, error: null });
    expect((await saveCommunityQuestion(input)).ok).toBe(false);
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '54000' } });
    expect(await saveCommunityQuestion(input)).toMatchObject({ ok: false, error: expect.stringContaining('límite') });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
