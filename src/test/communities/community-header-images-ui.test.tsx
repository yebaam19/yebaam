import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import translations from '../../../messages/es/communities.json';
import { CommunityHeaderImageButton } from '@/features/communities/components/CommunityHeaderImageButton';
import { DEFAULT_IMAGE_FRAMING as framing } from '@/features/communities/schemas/communityHeaderImage.schema';
const mocks = vi.hoisted(() => ({ save: vi.fn(), upload: vi.fn(), refresh: vi.fn(), revoke: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/features/communities/actions/header-images.actions', () => ({ saveCommunityHeaderImage: mocks.save }));
vi.mock('@/lib/service/upload.service', () => ({ uploadService: { uploadImage: mocks.upload } }));
const images = { version: 2, cover: { id: 'existing-image', framing }, profile: { id: null, framing } };
async function open(target: 'cover' | 'profile' = 'cover') {
  render(<NextIntlClientProvider locale="es" messages={{ communities: translations }}>
    <CommunityHeaderImageButton communityId="org" target={target} images={images} currentUrl={target === 'cover' ? '/cover.png' : undefined} />
  </NextIntlClientProvider>);
  fireEvent.click(screen.getByRole('button'));
  await screen.findByRole('dialog');
  if (target === 'cover') fireEvent.load(screen.getByAltText('Vista previa del encuadre'));
}
beforeEach(() => {
  vi.clearAllMocks(); URL.createObjectURL = vi.fn(() => 'blob:preview'); URL.revokeObjectURL = mocks.revoke;
  mocks.upload.mockResolvedValue({ id: 'new-image' }); mocks.save.mockResolvedValue({ ok: true, data: { version: 3 } });
});
describe('Identity image editor', () => {
  it('previews framing without remote writes and cancel restores the camera focus', async () => {
    await open(); fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), { target: { value: '2' } });
    expect(screen.getByAltText('Vista previa del encuadre')).toHaveStyle({ transform: 'scale(2)' });
    expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.upload).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar portada' })).toHaveFocus());
  });
  it('uploads only on save, retains failed framing, and reuses the upload when retrying', async () => {
    await open();
    fireEvent.change(screen.getByLabelText('Elegir imagen'), { target: { files: [new File(['image'], 'logo.png', { type: 'image/png' })] } });
    fireEvent.load(screen.getByAltText('Vista previa del encuadre'));
    fireEvent.change(screen.getByRole('slider', { name: 'Posición horizontal' }), { target: { value: '30' } });
    expect(mocks.upload).not.toHaveBeenCalled();
    mocks.save.mockResolvedValueOnce({ ok: false, error: 'Conflicto de guardado' });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar imagen' }));
    await screen.findByRole('alert'); expect(screen.getByRole('slider', { name: 'Posición horizontal' })).toHaveValue('30');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar imagen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(mocks.upload).toHaveBeenCalledTimes(1); expect(mocks.save).toHaveBeenLastCalledWith(expect.objectContaining({ imageId: 'new-image', framing: { x: 30, y: 50, zoom: 1 } }));
    expect(mocks.revoke).toHaveBeenCalledWith('blob:preview');
  });
  it('requires explicit removal confirmation and does not upload when removing', async () => {
    await open(); fireEvent.click(screen.getByRole('button', { name: 'Eliminar imagen' }));
    expect(mocks.save).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Sí, eliminar' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Conservar imagen' }));
    expect(mocks.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar imagen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ imageId: null, framing })));
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it('rejects unsupported local files and prevents saving a broken preview', async () => {
    await open('profile');
    fireEvent.change(screen.getByLabelText('Elegir imagen'), { target: { files: [new File(['bad'], 'bad.svg', { type: 'image/svg+xml' })] } });
    expect(screen.getByRole('alert')).toHaveTextContent('JPG'); expect(mocks.upload).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Elegir imagen'), { target: { files: [new File(['bad'], 'bad.png', { type: 'image/png' })] } });
    fireEvent.error(screen.getByAltText('Vista previa del encuadre'));
    expect(screen.getByRole('button', { name: 'Guardar imagen' })).toBeDisabled();
  });
});
