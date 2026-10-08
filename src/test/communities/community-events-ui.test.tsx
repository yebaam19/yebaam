import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/es/communities.json';
import { EventForm } from '@/features/communities/components/events/EventForm';
import { EventAttendance } from '@/features/communities/components/events/EventAttendance';
import { EventActions } from '@/features/communities/components/events/EventActions';
import { EventsIndex } from '@/features/communities/components/events/EventsIndex';
import type { CommunityEvent } from '@/features/communities/types/communityEvent.types';
const mocks = vi.hoisted(() => ({ save: vi.fn(), change: vi.fn(), attendance: vi.fn(), load: vi.fn(), library: vi.fn(), refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh, push: mocks.push, replace: mocks.replace }) }));
vi.mock('@/features/communities/actions/events/write.actions', () => ({ saveCommunityEvent: mocks.save, changeCommunityEvent: mocks.change }));
vi.mock('@/features/communities/actions/events/read-attendance.actions', () => ({ setEventAttendance: mocks.attendance, loadCommunityEvents: mocks.load }));
vi.mock('@/features/communities/actions/library/queries.actions', () => ({ loadLibraryAssets: mocks.library }));
const id = '11111111-1111-4111-8111-111111111111';
const event: CommunityEvent = { id, community_id: id, title: 'Encuentro', description: '', starts_at: '2026-10-01T10:00:00Z', ends_at: '2026-10-02T05:00:00Z', location: 'Salón', virtual_url: '', organizer: 'Comunidad', registration_info: '', registration_url: '', cover_asset_id: null, cover: null, rsvp_enabled: true, is_published: true, is_cancelled: false, version: 1 };
function show(child: ReactNode) { return render(<NextIntlClientProvider locale="es" messages={{ communities: messages }}>{child}</NextIntlClientProvider>); }
beforeEach(() => {
  vi.resetAllMocks(); mocks.save.mockResolvedValue({ ok: false, error: 'Error al guardar.' }); mocks.change.mockResolvedValue({ ok: true, data: { id } });
  mocks.library.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
});
describe('Events interaction', () => {
  it('keeps drafts private and preserves fields and creation id after a failed save', async () => {
    show(<EventForm communityId={id} slug="test" initial={null} organizer="Comunidad" />);
    expect(screen.getByLabelText(/Publicar evento/)).not.toBeChecked();
    expect(screen.getByLabelText('Permitir confirmar asistencia')).not.toBeChecked();
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Encuentro nuevo' } });
    fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: '2026-10-31T18:00' } });
    fireEvent.change(screen.getByLabelText('Finalización'), { target: { value: '2026-10-31T20:00' } });
    fireEvent.change(screen.getByLabelText('Lugar físico'), { target: { value: 'Salón' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar evento' })); await screen.findByText('Error al guardar.');
    expect(screen.getByLabelText('Título')).toHaveValue('Encuentro nuevo');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar evento' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Guardar evento' })); await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(mocks.save.mock.calls[0][0].id).toBe(mocks.save.mock.calls[1][0].id);
    expect(mocks.save.mock.calls[0][0]).toMatchObject({ isPublished: false, rsvpEnabled: false, startsAt: '2026-10-31T23:00:00.000Z' });
  });
  it('limits cover picker to photos without creating nested forms', async () => {
    const { container } = show(<EventForm communityId={id} slug="test" initial={null} organizer="Comunidad" />);
    fireEvent.click(screen.getByRole('button', { name: 'Elegir portada' })); await screen.findByText(/No hay archivos disponibles/);
    expect(screen.getByLabelText('Tipo')).toHaveValue('image');
    expect(screen.queryByRole('option', { name: 'Videos' })).not.toBeInTheDocument();
    expect(container.querySelector('form form')).toBeNull();
    expect(screen.getByRole('button', { name: 'Guardar evento' })).toBeDisabled();
  });
  it('requires confirmation and restores focus after dismissal and cancellation', async () => {
    show(<EventActions event={event} slug="test" />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar evento' })); expect(mocks.change).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Editar evento' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancelar evento' })).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar evento' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar evento' })).toHaveFocus());
    expect(mocks.change).toHaveBeenCalledWith({ communityId: id, id, expectedVersion: 1, operation: 'cancel', confirmed: true });
  });
  it('retains attendance after failure and permits withdrawal when signups are closed', async () => {
    mocks.attendance.mockResolvedValueOnce({ ok: false, error: 'No se pudo retirar.' }).mockResolvedValueOnce({ ok: true, data: { attending: false } });
    show(<EventAttendance eventId={id} signedIn initialAttending allowed={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retirar mi confirmación' })); await screen.findByText('No se pudo retirar.');
    expect(screen.getByText('Tu asistencia está confirmada.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Retirar mi confirmación' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Retirar mi confirmación' }));
    await screen.findByText('La confirmación de asistencia no está habilitada.');
    expect(mocks.attendance).toHaveBeenLastCalledWith({ eventId: id, attending: false });
  });
  it('filters calendar days and preserves existing events when loading fails', async () => {
    mocks.load.mockRejectedValue(new Error('network'));
    show(<EventsIndex communityId={id} slug="test" month="2026-10" initialView="calendar" canManage={false} initialNow="2026-10-01T11:00:00Z" initial={{ items: [event], nextCursor: { id, startsAt: event.starts_at } }} />);
    expect(screen.queryByRole('link', { name: 'Crear evento' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2026-10-02: 0 eventos' }));
    expect(screen.queryByRole('link', { name: 'Encuentro' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver todo el mes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más eventos' }));
    await screen.findByText('No se pudieron cargar los eventos.');
    expect(screen.getByRole('link', { name: 'Encuentro' })).toBeInTheDocument();
  });
});
