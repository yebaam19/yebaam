import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/es/communities.json';
import { LeaderDetailWorkspace } from '@/features/communities/components/leaders/LeaderDetailWorkspace';
import { LeadersWorkspace } from '@/features/communities/components/leaders/LeadersWorkspace';
import type { CommunityLeader } from '@/features/communities/types/communityLeader.types';
const mocks = vi.hoisted(() => ({ save: vi.fn(), category: vi.fn(), remove: vi.fn(), contacts: vi.fn(), media: vi.fn(), detach: vi.fn(), load: vi.fn(), refresh: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }) }));
vi.mock('next/dynamic', () => ({ default: () => function Editor({ label, content, onChange, disabled }: {
  label: string; content: string; onChange: (value: string) => void; disabled: boolean;
}) { return <textarea aria-label={label} value={content} disabled={disabled} onChange={(event) => onChange(event.target.value)} />; } }));
vi.mock('@/features/communities/actions/leaders/content.actions', () => ({ saveCommunityLeader: mocks.save, saveLeaderCategory: mocks.category, deleteCommunityLeader: mocks.remove, deleteLeaderCategory: mocks.remove }));
vi.mock('@/features/communities/actions/leaders/details.actions', () => ({ saveLeaderContacts: mocks.contacts, saveLeaderMedia: mocks.media, detachLeaderMedia: mocks.detach }));
vi.mock('@/features/communities/actions/leaders/queries.actions', () => ({ loadCommunityLeaders: vi.fn(), loadLeaderCategories: vi.fn() }));
vi.mock('@/features/communities/actions/library/queries.actions', () => ({ loadLibraryAssets: mocks.load }));
const communityId = '11111111-1111-4111-8111-111111111111';
const id = '22222222-2222-4222-8222-222222222222';
const leader: CommunityLeader = { id, community_id: communityId, section_id: id, category_id: null, full_name: 'Persona de ejemplo', responsibility: 'Coordinación', biography: '<p>Bio</p>', trajectory: '', position: 0, is_published: false, version: 2 };
const empty = { items: [], nextCursor: null };
function detail(canEdit = true) {
  return render(<NextIntlClientProvider locale="es" messages={{ communities: messages }}><LeaderDetailWorkspace slug="test" leader={leader} categories={empty} category={null} contacts={null} media={[]} canEdit={canEdit} /></NextIntlClientProvider>);
}
function directory() {
  return render(<NextIntlClientProvider locale="es" messages={{ communities: messages }}><LeadersWorkspace communityId={communityId} slug="test" section={{ id, community_id: communityId, kind: 'leaders', title: 'Equipo', position: 4, is_visible: true, version: 1 }} categories={empty} leaders={empty} capabilities={{ content: true, settings: false, plans: false, moderation: false }} /></NextIntlClientProvider>);
}
beforeEach(() => {
  vi.resetAllMocks(); mocks.save.mockResolvedValue({ ok: false, error: 'Error de prueba al guardar.' });
  mocks.category.mockResolvedValue({ ok: false, error: 'No se pudo crear la categoría.' });
  mocks.contacts.mockResolvedValue({ ok: false, error: 'No se pudo guardar el contacto.' });
  mocks.load.mockResolvedValue({ ok: true, data: empty });
});
describe('Directory editing', () => {
  it('preserves rich fields across switching and failed writes, and blocks competing actions', async () => {
    detail(); fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText('Biografía'), { target: { value: '<p>Nueva bio</p>' } });
    fireEvent.change(screen.getByLabelText('Sección de texto'), { target: { value: 'trajectory' } });
    fireEvent.change(screen.getByLabelText('Trayectoria'), { target: { value: '<p>Trayectoria nueva</p>' } });
    expect(screen.getByRole('button', { name: 'Editar contacto' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' })); await screen.findByText('Error de prueba al guardar.');
    await waitFor(() => expect(screen.getByLabelText('Sección de texto')).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Sección de texto'), { target: { value: 'biography' } });
    expect(screen.getByLabelText('Biografía')).toHaveValue('<p>Nueva bio</p>');
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ expectedVersion: 2, trajectory: '<p>Trayectoria nueva</p>', isPublished: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar' })).toHaveFocus());
  });
  it('keeps contact sharing opt-in and retains email after failure', async () => {
    detail(); fireEvent.click(screen.getByRole('button', { name: 'Editar contacto' }));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    fireEvent.change(screen.getByLabelText('Correo de contacto'), { target: { value: 'public@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' })); await screen.findByText('No se pudo guardar el contacto.');
    expect(screen.getByLabelText('Correo de contacto')).toHaveValue('public@example.test');
    expect(mocks.contacts).toHaveBeenCalledWith(expect.objectContaining({ isPublic: false, email: 'public@example.test' }));
  });
  it('requires explicit deletion and navigates back after success', async () => {
    mocks.remove.mockResolvedValue({ ok: true, data: { id } }); detail();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Persona de ejemplo' }));
    expect(mocks.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/feed/comunidades/test/lideres'));
    expect(mocks.remove).toHaveBeenCalledWith({ communityId, id, expectedVersion: 2, confirmed: true });
  });
  it('limits each media slot to its allowed library type', async () => {
    detail(); fireEvent.click(screen.getByRole('button', { name: 'Seleccionar Video de presentación' }));
    await screen.findByText(/No hay archivos disponibles/);
    expect(screen.getByLabelText('Tipo')).toHaveValue('video');
    expect(screen.queryByRole('option', { name: 'Fotos' })).not.toBeInTheDocument();
  });
  it('hides all management controls and private contact placeholders from readers', () => {
    detail(false); expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Contacto y redes')).not.toBeInTheDocument();
    expect(screen.queryByText('Fotos y video de la ficha')).not.toBeInTheDocument();
  });
  it('retains a stable create id across retries and keeps directory filtering locked', async () => {
    directory(); fireEvent.click(screen.getByRole('button', { name: 'Agregar integrante' }));
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Integrante nuevo' } });
    expect(screen.getAllByRole('combobox', { name: 'Categoría' })[0]).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' })); await screen.findByText('Error de prueba al guardar.');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(mocks.save.mock.calls[0][0].id).toBe(mocks.save.mock.calls[1][0].id);
  });
});
