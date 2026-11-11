import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, expect, it, vi } from 'vitest'
import { DirectoryEntryForm } from '@/features/admin/components/cities/directory/DirectoryEntryForm'
import admin from '../../../messages/es/admin.json'

const { save, refresh } = vi.hoisted(() => ({ save: vi.fn(), refresh: vi.fn() }))
vi.mock('@/features/admin/actions/city-directory.actions', () => ({ saveCityDirectoryEntry: save }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
vi.mock('@/lib/service/upload.service', () => ({ uploadService: { uploadImage: vi.fn() } }))
beforeEach(() => vi.clearAllMocks())
function form() {
  render(<NextIntlClientProvider locale="es" messages={{ admin }}>
    <DirectoryEntryForm cityId="37407eb6-2135-4ac2-9637-e41d6e112256" category="government" />
  </NextIntlClientProvider>)
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Town hall' } })
}
it('starts private and reuses its identifier after a failed save', async () => {
  save.mockResolvedValueOnce({ ok: false, error: 'save_failed' }).mockResolvedValueOnce({ ok: true, data: {} })
  form()
  expect(screen.getByLabelText('Estado')).toHaveValue('draft')
  fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }))
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  const first = save.mock.calls[0][0]
  fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }))
  await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
  expect(save.mock.calls[1][0].id).toBe(first.id)
  expect(screen.getByLabelText('Nombre')).toHaveValue('')
})
it('requires confirmation before archiving', () => {
  form()
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'archived' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }))
  expect(confirm).toHaveBeenCalledOnce()
  expect(save).not.toHaveBeenCalled()
  confirm.mockRestore()
})
