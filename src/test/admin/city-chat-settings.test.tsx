// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ save: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }))
vi.mock('@/features/admin/actions/city-communication.actions', () => ({ saveCityChat: mocks.save, provisionCityCommunication: vi.fn() }))
import { CityChatSettings } from '@/features/admin/components/cities/editor/CityChatSettings'

it('keeps edited room values when a save fails', async () => {
  mocks.save.mockRejectedValue(new Error('network'))
  render(<CityChatSettings cityId="city" chat={{ id: 'room', name: 'Original', description: '', max_capacity: 250, is_archived: false }} />)
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Nombre corregido' } })
  fireEvent.change(screen.getByLabelText('Capacidad'), { target: { value: '150' } })
  fireEvent.click(screen.getByLabelText('Cerrar temporalmente la sala'))
  fireEvent.click(screen.getByRole('button', { name: 'Guardar sala' }))
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Conservamos tus datos'))
  expect(screen.getByLabelText('Nombre')).toHaveValue('Nombre corregido')
  expect(screen.getByLabelText('Capacidad')).toHaveValue(150)
  expect(screen.getByLabelText('Cerrar temporalmente la sala')).toBeChecked()
  expect(mocks.refresh).not.toHaveBeenCalled()
})
