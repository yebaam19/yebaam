import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ChatCasePanel from '@/features/chat-publico/components/ChatCasePanel'

const mocks = vi.hoisted(() => ({ list: vi.fn(), defend: vi.fn(), resolve: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }))
vi.mock('@/features/chat-publico/actions/community-chat-cases.actions', () => ({
  listCommunityChatCases: mocks.list,
  submitCommunityChatCaseDefense: mocks.defend,
  resolveCommunityChatCase: mocks.resolve,
}))

const communityId = '11111111-1111-4111-8111-111111111111'
const caseId = '22222222-2222-4222-8222-222222222222'
const item = {
  id: caseId, community_id: communityId, user_id: '33333333-3333-4333-8333-333333333333',
  requested_by: '44444444-4444-4444-8444-444444444444',
  kind: 'suspend', duration_hours: 24, reason: 'Conducta repetida en el chat',
  status: 'open', created_at: '2026-10-01T00:00:00Z',
  notified_at: '2026-10-01T01:00:00Z', defense_deadline: '2026-10-03T01:00:00Z',
  defense_statement: null, outcome: null, resolved_at: null, resolution_reason: null,
  displayName: 'Persona de prueba', canReview: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true, value() { this.open = true },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true, value() { this.open = false },
  })
  mocks.list.mockResolvedValue({ ok: true, items: [item], nextCursor: null })
  mocks.defend.mockResolvedValue({ ok: true })
  mocks.resolve.mockResolvedValue({ ok: true })
})

describe('community chat case panel', () => {
  it('lets the subject submit a defense without applying a restriction', async () => {
    mocks.list.mockResolvedValueOnce({ ok: true, items: [{ ...item,
      status: 'pending_notice', notified_at: null, defense_deadline: null }], nextCursor: null })
    render(<ChatCasePanel communityId={communityId} scope="mine" onClose={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Presentar descargos' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Tus descargos' }), {
      target: { value: 'Quiero explicar el contexto del mensaje.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar descargos' }))
    await waitFor(() => expect(mocks.defend).toHaveBeenCalledWith({
      caseId, statement: 'Quiero explicar el contexto del mensaje.',
    }))
    expect(mocks.resolve).not.toHaveBeenCalled()
  })

  it('does not offer resolution before the defense deadline or to the opener', async () => {
    mocks.list.mockResolvedValueOnce({ ok: true, items: [{ ...item,
      defense_deadline: '2099-10-03T01:00:00Z' }], nextCursor: null })
    const view = render(<ChatCasePanel communityId={communityId} scope="staff" onClose={vi.fn()} />)
    await screen.findByText('Persona de prueba · Suspensión propuesta: 24 h')
    expect(screen.queryByRole('button', { name: 'Resolver' })).not.toBeInTheDocument()
    view.unmount()
    mocks.list.mockResolvedValueOnce({ ok: true, items: [{ ...item, canReview: false }], nextCursor: null })
    render(<ChatCasePanel communityId={communityId} scope="staff" onClose={vi.fn()} />)
    await screen.findByText('Persona de prueba · Suspensión propuesta: 24 h')
    expect(screen.queryByRole('button', { name: 'Resolver' })).not.toBeInTheDocument()
  })

  it('records a reasoned independent decision and refreshes the chat', async () => {
    render(<ChatCasePanel communityId={communityId} scope="staff" onClose={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Resolver' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Decisión' }), {
      target: { value: 'warn' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Motivo de la resolución' }), {
      target: { value: 'Advertencia proporcional tras revisar los descargos.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar resolución' }))
    await waitFor(() => expect(mocks.resolve).toHaveBeenCalledWith({
      caseId, decision: 'warn', reason: 'Advertencia proporcional tras revisar los descargos.',
    }))
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce())
  })
})
