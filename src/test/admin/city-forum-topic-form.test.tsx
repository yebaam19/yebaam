// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import NewTopicForm from '@/features/foro/components/NewTopicForm'

const mocks = vi.hoisted(() => ({ create: vi.fn(), push: vi.fn() }))
vi.mock('@/features/foro/actions/foro.actions', () => ({ createTopic: mocks.create }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/features/foro/components/PostEditor', () => ({ default: ({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) => <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} /> }))
vi.mock('@/ui/Button', () => ({ Button: ({ children, type, disabled }: { children: React.ReactNode; type?: 'submit' | 'button'; disabled?: boolean }) => <button type={type ?? 'button'} disabled={disabled}>{children}</button> }))
beforeEach(() => vi.resetAllMocks())
it('retries a failed network request with the same topic id and accessible error', async () => {
  mocks.create.mockRejectedValueOnce(new Error('lost response'))
    .mockResolvedValueOnce({ ok: true, spaceSlug: 'city', forumSlug: 'general', topicSlug: 'topic' })
  render(<NewTopicForm spaceSlug="city" forumId="11111111-1111-4111-8111-111111111111" forumSlug="general" forumName="General" />)
  fireEvent.change(screen.getByLabelText('newTopic.fields.titleLabel'), { target: { value: 'Tema' } })
  fireEvent.change(screen.getByLabelText('newTopic.fields.messageLabel'), { target: { value: 'Mensaje' } })
  fireEvent.click(screen.getByRole('button', { name: 'newTopic.submit' }))
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'newTopic.submit' }))
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/foro/city/general/topic'))
  expect(mocks.create.mock.calls[0][0].requestId).toBeTruthy()
  expect(mocks.create.mock.calls[0][0].requestId).toBe(mocks.create.mock.calls[1][0].requestId)
})
