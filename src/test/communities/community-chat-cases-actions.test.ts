import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  openCommunityChatCase, resolveCommunityChatCase,
  submitCommunityChatCaseDefense,
} from '@/features/chat-publico/actions/community-chat-cases.actions'

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), schedule: vi.fn(), revalidate: vi.fn() }))
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({
  auth: { getUser: mocks.getUser }, rpc: mocks.rpc,
}) }))
vi.mock('@/features/communities/server/schedule-chat-case-mail.server', () => ({
  scheduleChatCaseMail: mocks.schedule,
}))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }))

const caseId = '11111111-1111-4111-8111-111111111111'
const communityId = '22222222-2222-4222-8222-222222222222'
const userId = '33333333-3333-4333-8333-333333333333'
const reason = 'Conducta repetida en el chat comunitario.'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } })
  mocks.rpc.mockResolvedValue({ data: caseId, error: null })
})

describe('community chat case actions', () => {
  it('requires a verified user before creating a case or scheduling mail', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } })
    expect(await openCommunityChatCase({ caseId, communityId, userId,
      kind: 'suspend', hours: 24, reason })).toMatchObject({ ok: false })
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(mocks.schedule).not.toHaveBeenCalled()
  })

  it('opens a case with a stable key and schedules only after DB success', async () => {
    expect(await openCommunityChatCase({ caseId, communityId, userId,
      kind: 'suspend', hours: 24, reason })).toEqual({ ok: true })
    expect(mocks.rpc).toHaveBeenCalledWith('open_community_chat_case', {
      case_id: caseId, target_community: communityId, target_user: userId,
      proposed_kind: 'suspend', proposed_hours: 24, case_reason: reason,
    })
    expect(mocks.schedule).toHaveBeenCalledOnce()
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '23505' } })
    expect(await openCommunityChatCase({ caseId, communityId, userId,
      kind: 'suspend', hours: 24, reason })).toMatchObject({ ok: false })
    expect(mocks.schedule).toHaveBeenCalledOnce()
  })

  it('submits defense and only refreshes the chat after a resolved case', async () => {
    expect(await submitCommunityChatCaseDefense({ caseId,
      statement: 'Quiero explicar el contexto de los mensajes.' })).toEqual({ ok: true })
    expect(mocks.rpc).toHaveBeenCalledWith('submit_community_chat_case_defense', {
      target_case: caseId, statement: 'Quiero explicar el contexto de los mensajes.',
    })
    expect(await resolveCommunityChatCase({ caseId, decision: 'warn', reason })).toEqual({ ok: true })
    expect(mocks.rpc).toHaveBeenCalledWith('resolve_community_chat_case', {
      target_case: caseId, decision: 'warn', decision_reason: reason,
    })
    expect(mocks.revalidate).toHaveBeenCalledWith('/feed/comunidades/[slug]/chat', 'page')
  })

  it('leaves the page untouched when resolution fails', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'case_defense_open' } })
    expect(await resolveCommunityChatCase({ caseId, decision: 'restrict', reason }))
      .toEqual({ ok: false, error: 'Espera el aviso por correo y las 48 horas de descargos.' })
    expect(mocks.revalidate).not.toHaveBeenCalled()
  })
})
