import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/es/communities.json';
import { PlanAttachments } from '@/features/communities/components/plans/PlanAttachments';
import { PlanInteractionProvider } from '@/features/communities/components/plans/PlanInteractionProvider';
import type { LibraryAsset, LibraryPage } from '@/features/communities/types/communityLibrary.types';
import type { PlanPoint } from '@/features/communities/types/communityPlan.types';
import type { ActionResult } from '@/features/communities/actions/_shared';

const mocks = vi.hoisted(() => ({ load: vi.fn(), more: vi.fn(), attach: vi.fn(), detach: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/features/communities/actions/library/queries.actions', () => ({ loadLibraryAssets: mocks.load, loadPlanAttachments: mocks.more }));
vi.mock('@/features/communities/actions/library/attachments.actions', () => ({ attachLibraryAsset: mocks.attach, detachLibraryAsset: mocks.detach }));
const asset: LibraryAsset = {
  id: 'file', community_id: 'community', kind: 'document', folder_id: null, title: 'Acta de trabajo',
  description: '', media_id: 'owner/acta.pdf', original_name: 'acta.pdf', content_type: 'application/pdf',
  size_bytes: 1000, duration_seconds: null, uploaded_by: null, visibility: 'members', is_published: true,
  version: 1, created_at: '2026-10-08T12:00:00Z',
};
const attachment = { id: 'link', community_id: 'community', point_id: 'point', asset_id: asset.id, position: 0, asset };
const point: PlanPoint = {
  id: 'point', community_id: 'community', section_id: 'section', axis_id: 'axis', title: 'Trabajo',
  content: '', description: '', position: 0, is_published: true, version: 1,
  attachments: { items: [attachment], nextCursor: { id: 'link', position: 0 } },
};
function mount(canEdit = true) {
  return render(<NextIntlClientProvider locale="es" timeZone="America/Bogota" messages={{ communities: messages }}>
    <PlanInteractionProvider><PlanAttachments point={point} canEdit={canEdit} /></PlanInteractionProvider>
  </NextIntlClientProvider>);
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.load.mockResolvedValue({ ok: true, data: { items: [{ ...asset, id: 'new-file', title: 'Informe anual' }], nextCursor: null } });
  mocks.attach.mockResolvedValue({ ok: false, error: 'No se pudo adjuntar. Reintenta.' });
  mocks.detach.mockResolvedValue({ ok: false, error: 'No se pudo quitar el vínculo.' });
});

describe('plan attachments', () => {
  it('renders authorized reader downloads without administrative controls', () => {
    mount(false);
    expect(screen.getByRole('link', { name: 'Descargar' })).toHaveAttribute('href', '/api/communities/community/assets/file/file');
    expect(screen.queryByRole('button', { name: /Adjuntar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Quitar vínculo/ })).not.toBeInTheDocument();
  });
  it('keeps the picker and stable ID when attaching fails, then refreshes after success', async () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Adjuntar archivo a Trabajo' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Adjuntar Informe anual' }));
    await screen.findByText('No se pudo adjuntar. Reintenta.');
    expect(screen.getByLabelText('Tipo')).toHaveValue('document');
    expect(mocks.refresh).not.toHaveBeenCalled();
    const id = mocks.attach.mock.calls[0][0].id;
    mocks.attach.mockResolvedValue({ ok: true, data: { id } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Adjuntar Informe anual' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Adjuntar Informe anual' }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
    expect(mocks.attach.mock.calls[1][0]).toEqual({ communityId: 'community', pointId: 'point', assetId: 'new-file', id });
    expect(screen.queryByText('Elegir de la biblioteca')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Adjuntar archivo a Trabajo' })).toBeEnabled());
    expect(screen.getByRole('button', { name: 'Adjuntar archivo a Trabajo' })).toHaveFocus();
  });
  it('requires confirmation and preserves file linkage controls after a detach failure', async () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar vínculo de Acta de trabajo' }));
    expect(mocks.detach).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Adjuntar archivo a Trabajo' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Sí, quitar vínculo' }));
    await screen.findByText('No se pudo quitar el vínculo.');
    expect(mocks.detach).toHaveBeenCalledWith({ communityId: 'community', pointId: 'point', assetId: 'file', id: 'link', confirmed: true });
    expect(mocks.refresh).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Adjuntar archivo a Trabajo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Quitar vínculo de Acta de trabajo' })).toHaveFocus();
  });
  it('ignores a late search response from the previous file type', async () => {
    let resolve!: (result: ActionResult<LibraryPage>) => void;
    mocks.load.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Adjuntar archivo a Trabajo' }));
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'image' } });
    await screen.findByRole('button', { name: 'Adjuntar Informe anual' });
    await act(async () => resolve({ ok: true, data: { items: [{ ...asset, title: 'Resultado obsoleto' }], nextCursor: null } }));
    expect(screen.queryByText('Resultado obsoleto')).not.toBeInTheDocument();
    expect(mocks.load).toHaveBeenLastCalledWith({ communityId: 'community', kind: 'image', search: '' });
  });
  it('retries attachment pagination without dropping already rendered files', async () => {
    mocks.more.mockResolvedValueOnce({ ok: false, error: 'Reintenta la carga.' });
    mount(false);
    fireEvent.click(screen.getByRole('button', { name: 'Ver más adjuntos' }));
    await screen.findByText('Reintenta la carga.');
    expect(screen.getByText('Acta de trabajo')).toBeVisible();
    mocks.more.mockResolvedValue({ ok: true, data: { items: [{ ...attachment, id: 'link-2', asset: { ...asset, title: 'Segundo archivo' } }], nextCursor: null } });
    fireEvent.click(await screen.findByRole('button', { name: 'Ver más adjuntos' }));
    await screen.findByText('Segundo archivo');
    expect(mocks.more).toHaveBeenLastCalledWith({ communityId: 'community', pointId: 'point', cursor: { id: 'link', position: 0 } });
    expect(screen.queryByRole('button', { name: 'Ver más adjuntos' })).not.toBeInTheDocument();
  });
});
