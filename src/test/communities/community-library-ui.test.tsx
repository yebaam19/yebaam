import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/es/communities.json';
import { LibraryWorkspace } from '@/features/communities/components/library/LibraryWorkspace';
import type { LibraryAsset } from '@/features/communities/types/communityLibrary.types';

const mocks = vi.hoisted(() => ({ save: vi.fn(), remove: vi.fn(), finalize: vi.fn(), refresh: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }) }));
vi.mock('@/features/communities/actions/library/content.actions', () => ({ saveLibraryAsset: mocks.save, deleteLibraryAsset: mocks.remove,
  finalizeLibraryAsset: mocks.finalize, saveAssetFolder: vi.fn(), deleteAssetFolder: vi.fn() }));
vi.mock('@/features/communities/actions/library/queries.actions', () => ({ loadLibraryAssets: vi.fn(), loadAssetFolders: vi.fn() }));
const asset: LibraryAsset = { id: 'asset', community_id: 'community', kind: 'document', folder_id: 'folder-not-in-first-page',
  title: 'Informe anual', description: 'Resultados de la comunidad', media_id: 'owner/report.pdf', original_name: 'report.pdf',
  content_type: 'application/pdf', size_bytes: 1024, duration_seconds: null, uploaded_by: 'owner', visibility: 'editors',
  is_published: false, version: 2, created_at: '2026-10-08T12:00:00Z' };
function mount(canEdit = true) {
  return render(<NextIntlClientProvider locale="es" timeZone="America/Bogota" messages={{ communities: messages }}>
    <LibraryWorkspace communityId="community" kind="document" initial={{ items: [asset], nextCursor: null }} folders={{ items: [], nextCursor: null }}
      canEdit={canEdit} basePath="/feed/comunidades/test/archivos" search="" />
  </NextIntlClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
  mocks.save.mockResolvedValue({ ok: false, error: 'No se pudo guardar. Inténtalo de nuevo.' });
});

describe('library editor protections', () => {
  it('preserves edits, publication, audience and the existing folder after a failed save', async () => {
    mount();
    fireEvent.click(screen.getByText('Opciones'));
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Borrador conservado' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Mi revisión' } });
    fireEvent.change(screen.getByLabelText('Quién puede verlo'), { target: { value: 'members' } });
    fireEvent.click(screen.getByLabelText('Publicado'));
    expect(screen.getByRole('button', { name: 'Subir archivos' })).toBeDisabled();
    expect(within(screen.getByRole('search')).getByRole('button', { name: 'Buscar' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar'));
    expect(screen.getByLabelText('Título')).toHaveValue('Borrador conservado');
    expect(screen.getByLabelText('Descripción')).toHaveValue('Mi revisión');
    expect(screen.getByLabelText('Publicado')).toBeChecked();
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ folderId: asset.folder_id, visibility: 'members', expectedVersion: 2 }));
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it('does not delete on opening confirmation and allows cancellation', () => {
    mount();
    fireEvent.click(screen.getByText('Opciones'));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByRole('heading', { name: '¿Eliminar «Informe anual» de la biblioteca?' })).toBeVisible();
    expect(mocks.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('heading', { name: '¿Eliminar «Informe anual» de la biblioteca?' })).not.toBeInTheDocument();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it('keeps management tools out of the reader view and routes downloads through authorization', () => {
    mount(false);
    expect(screen.queryByRole('button', { name: 'Subir archivos' })).not.toBeInTheDocument();
    expect(screen.queryByText('Opciones')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Descargar' })).toHaveAttribute('href', '/api/communities/community/assets/asset/file');
    expect(screen.getByRole('link', { name: /Vista previa/ })).toHaveAttribute('href', '/api/communities/community/assets/asset/file?preview=1');
  });
});
