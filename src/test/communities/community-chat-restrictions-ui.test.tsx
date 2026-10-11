import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ChatRestrictionsPanel from '@/features/chat-publico/components/ChatRestrictionsPanel'

const mocks = vi.hoisted(() => ({ list: vi.fn(), open: vi.fn(), release: vi.fn() }))
vi.mock('@/features/chat-publico/actions/community-chat-restrictions.actions', () => ({
  listCommunityChatRestrictions: mocks.list,
  releaseCommunityChatRestriction: mocks.release,
}))
vi.mock('@/features/chat-publico/actions/community-chat-cases.actions', () => ({
  openCommunityChatCase: mocks.open,
}))

const communityId = '11111111-1111-4111-8111-111111111111'
const userId = '22222222-2222-4222-8222-222222222222'

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true, value() { this.open = true },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true, value() { this.open = false },
  })
  mocks.list.mockResolvedValue({ ok: true, items: [], nextCursor: null })
  mocks.open.mockResolvedValue({ ok: false, error: 'No se pudo abrir el expediente.' })
  mocks.release.mockResolvedValue({ ok: true })
})

describe('community chat restriction panel', () => {
  it('keeps the reason after a failed case opening and limits moderator durations', async () => {
    render(<ChatRestrictionsPanel communityId={communityId} canBlock={false}
      target={{ userId, label: 'Persona de prueba' }} onClose={vi.fn()} />)
    await screen.findByText('No hay restricciones activas.')
    expect(screen.getByRole('option', { name: '24 horas' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Bloqueo hasta revisión' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Motivo' }), {
      target: { value: 'Conducta repetida en el chat' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Abrir expediente' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo abrir'))
    expect(screen.getByRole('textbox', { name: 'Motivo' })).toHaveValue('Conducta repetida en el chat')
    expect(mocks.open).toHaveBeenCalledWith(expect.objectContaining({
      communityId, userId, kind: 'suspend', hours: 24, reason: 'Conducta repetida en el chat',
      caseId: expect.any(String),
    }))
    const firstCaseId = mocks.open.mock.calls[0][0].caseId
    fireEvent.click(screen.getByRole('button', { name: 'Abrir expediente' }))
    await waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(2))
    expect(mocks.open.mock.calls[1][0].caseId).toBe(firstCaseId)
  })

  it('lets an administrator review and lift an active block with a reason', async () => {
    mocks.list.mockResolvedValueOnce({ ok: true, items: [{
      community_id: communityId, user_id: userId, displayName: 'Persona de prueba',
      kind: 'block', expires_at: null, reason: 'Motivo inicial documentado',
      decided_at: '2026-10-09T00:00:00Z', revoked_at: null, version: 1,
    }], nextCursor: null }).mockResolvedValue({ ok: true, items: [], nextCursor: null })
    render(<ChatRestrictionsPanel communityId={communityId} canBlock target={null} onClose={vi.fn()} />)
    await screen.findByText('Motivo inicial documentado')
    fireEvent.click(screen.getByRole('button', { name: 'Levantar' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Motivo' }), {
      target: { value: 'La revisión administrativa confirmó el levantamiento' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Levantar restricción' }))
    await waitFor(() => expect(mocks.release).toHaveBeenCalledWith({
      communityId, userId, reason: 'La revisión administrativa confirmó el levantamiento',
    }))
    await screen.findByText(/Operación guardada/)
    expect(screen.getByText('No hay restricciones activas.')).toBeInTheDocument()
  })
})
