import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ChatReviewPanel from '@/features/chat-publico/components/ChatReviewPanel'

const mocks = vi.hoisted(() => ({ list: vi.fn(), submit: vi.fn(), resolve: vi.fn() }))
vi.mock('@/features/chat-publico/actions/community-chat-review.actions', () => ({
  listCommunityChatReviews: mocks.list,
  submitCommunityChatReview: mocks.submit,
  resolveCommunityChatReview: mocks.resolve,
}))

const communityId = '11111111-1111-4111-8111-111111111111'
const userId = '22222222-2222-4222-8222-222222222222'
const restriction = {
  community_id: communityId, user_id: userId, kind: 'suspend' as const,
  expires_at: '2099-01-01T00:00:00Z', reason: 'Motivo inicial documentado',
  decided_at: '2026-10-09T00:00:00Z', revoked_at: null, version: 2,
}
const defense = {
  id: '33333333-3333-4333-8333-333333333333', community_id: communityId,
  user_id: userId, restriction_version: 2, stage: 'defense',
  statement: 'Quiero explicar el contexto de mis mensajes.',
  status: 'upheld', submitted_at: '2026-10-09T01:00:00Z',
  reviewed_at: '2026-10-09T02:00:00Z',
  review_reason: 'Los mensajes muestran una conducta repetida.',
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true, value() { this.open = true },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true, value() { this.open = false },
  })
  mocks.list.mockResolvedValue({ ok: true, items: [], nextCursor: null })
  mocks.submit.mockResolvedValue({ ok: true })
  mocks.resolve.mockResolvedValue({ ok: true })
})

describe('community chat review panel', () => {
  it('lets the affected member submit a defense and clears the form after success', async () => {
    render(<ChatReviewPanel communityId={communityId} scope="mine"
      restriction={restriction} canBlock={false} onClose={vi.fn()} />)
    await screen.findByText('No hay solicitudes.')
    fireEvent.change(screen.getByRole('textbox', { name: 'Presentar descargos' }), {
      target: { value: 'Quiero explicar el contexto de mis mensajes.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    await waitFor(() => expect(mocks.submit).toHaveBeenCalledWith({
      communityId, statement: 'Quiero explicar el contexto de mis mensajes.',
    }))
    expect(await screen.findByRole('status')).toHaveTextContent('Tu solicitud quedó registrada.')
    expect(screen.getByRole('textbox', { name: 'Presentar descargos' })).toHaveValue('')
  })

  it('offers an appeal only after the defense was upheld', async () => {
    mocks.list.mockResolvedValue({ ok: true, items: [defense], nextCursor: null })
    render(<ChatReviewPanel communityId={communityId} scope="mine"
      restriction={restriction} canBlock={false} onClose={vi.fn()} />)
    await screen.findByText(/Los mensajes muestran una conducta repetida/)
    expect(screen.queryByRole('textbox', { name: 'Presentar descargos' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Presentar apelación' })).toBeInTheDocument()
  })

  it('requires a reason and records an administrative review', async () => {
    const appeal = { ...defense, id: '44444444-4444-4444-8444-444444444444',
      stage: 'appeal', status: 'open', reviewed_at: null, review_reason: null,
      displayName: 'Persona de prueba' }
    mocks.list.mockResolvedValueOnce({ ok: true, items: [appeal], nextCursor: null })
      .mockResolvedValue({ ok: true, items: [], nextCursor: null })
    render(<ChatReviewPanel communityId={communityId} scope="staff"
      restriction={null} canBlock onClose={vi.fn()} />)
    await screen.findByText('Persona de prueba · Apelación')
    fireEvent.click(screen.getByRole('button', { name: 'Levantar' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Motivo de la revisión' }), {
      target: { value: 'La apelación procede tras revisar los mensajes.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar decisión' }))
    await waitFor(() => expect(mocks.resolve).toHaveBeenCalledWith({
      requestId: appeal.id, decision: 'lift',
      reason: 'La apelación procede tras revisar los mensajes.',
    }))
    expect(await screen.findByText('Revisión guardada y notificada.')).toBeInTheDocument()
  })
})
