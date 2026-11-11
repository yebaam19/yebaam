// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ save: vi.fn(), refresh: vi.fn(), upload: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }))
vi.mock('@/lib/service/upload.service', () => ({ uploadService: { uploadImage: mocks.upload } }))
vi.mock('@/features/admin/actions/city-emprendimiento-editor.actions', () => ({ saveCityEmprendimiento: mocks.save }))
import { AdminEmprendimientoForm } from '@/features/admin/components/cities/editor/AdminEmprendimientoForm'

beforeEach(() => vi.clearAllMocks())

describe('admin emprendimiento form', () => {
  it('retains data and request identity after network failure, then closes on success', async () => {
    const close = vi.fn()
    mocks.save.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ ok: true, data: { id: 'saved' } })
    render(<AdminEmprendimientoForm cityId="city" onClose={close} />)
    fireEvent.change(screen.getByLabelText('Nombre del emprendimiento'), { target: { value: 'Mi panadería' } })
    fireEvent.change(screen.getByLabelText('Descripción breve'), { target: { value: 'Pan fresco' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar emprendimiento' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Puedes volver a intentarlo')
    expect(close).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Nombre del emprendimiento')).toHaveValue('Mi panadería')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar emprendimiento' }))
    await waitFor(() => expect(close).toHaveBeenCalledOnce())
    expect(mocks.save.mock.calls[0][0].id).toBe(mocks.save.mock.calls[1][0].id)
    expect(mocks.refresh).toHaveBeenCalledOnce()
  })

  it('does not allow save while the Cloudflare upload is pending', async () => {
    let finish!: (value: { id: string }) => void
    mocks.upload.mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    render(<AdminEmprendimientoForm cityId="city" onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText('Portada'), { target: { files: [new File(['image'], 'photo.png', { type: 'image/png' })] } })
    expect(screen.getByRole('button', { name: 'Subiendo imagen…' })).toBeDisabled()
    expect(mocks.upload).toHaveBeenCalledWith(expect.any(File), undefined, { source: 'city-emprendimiento' })
    finish({ id: 'image-id' })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar emprendimiento' })).toBeEnabled())
  })
})
