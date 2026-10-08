import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/es/communities.json';
import { AboutWorkspace } from '@/features/communities/components/about/AboutWorkspace';
import type { CommunityAbout } from '@/features/communities/types/communityAbout.types';

const mocks = vi.hoisted(() => ({ save: vi.fn(), attach: vi.fn(), detach: vi.fn(), load: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('next/dynamic', () => ({ default: () => function Editor({ label, content, onChange, disabled }: {
  label: string; content: string; onChange: (value: string) => void; disabled: boolean;
}) { return <textarea aria-label={label} value={content} disabled={disabled} onChange={(event) => onChange(event.target.value)} />; } }));
vi.mock('@/features/communities/actions/about/content.actions', () => ({ saveCommunityAbout: mocks.save, attachAboutMedia: mocks.attach, detachAboutMedia: mocks.detach }));
vi.mock('@/features/communities/actions/about/queries.actions', () => ({ loadAboutMedia: vi.fn() }));
vi.mock('@/features/communities/actions/library/queries.actions', () => ({ loadLibraryAssets: mocks.load }));
const communityId = '11111111-1111-4111-8111-111111111111';
const id = '22222222-2222-4222-8222-222222222222';
const about: CommunityAbout = {
  id, community_id: communityId, description: '<p>Organización comunitaria.</p>', history: '<p>Nuestra historia.</p>',
  mission: '', vision: '', objectives: '', values: '', founded_on: '2020-01-01', location: 'Popayán',
  contact_email: 'hello@example.test', contact_phone: '', website: 'https://example.test', social_links: [],
  is_published: false, version: 3,
};
function mount(canEdit = true) {
  return render(<NextIntlClientProvider locale="es" timeZone="America/Bogota" messages={{ communities: messages }}>
    <AboutWorkspace communityId={communityId} name="Comunidad de prueba" about={{ ...about, is_published: !canEdit }}
      section={{ id, community_id: communityId, kind: 'about', title: 'Acerca de nosotros', position: 0, is_visible: true, version: 1 }}
      media={{ items: [], nextCursor: null }} capabilities={{ content: canEdit, settings: false, plans: false, moderation: false }} />
  </NextIntlClientProvider>);
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.save.mockResolvedValue({ ok: false, error: 'No se pudo guardar la información.' });
  mocks.load.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
});

describe('About editing', () => {
  it('preserves every rich section and contact field on error, and blocks unrelated actions', async () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Editar información' }));
    fireEvent.change(screen.getByLabelText('Descripción general'), { target: { value: '<p>Descripción nueva.</p>' } });
    fireEvent.change(screen.getByLabelText('Sección de texto'), { target: { value: 'mission' } });
    fireEvent.change(screen.getByLabelText('Misión'), { target: { value: '<p>Misión nueva.</p>' } });
    fireEvent.change(screen.getByLabelText('Correo de contacto'), { target: { value: 'nuevo@example.test' } });
    expect(screen.getByRole('button', { name: 'Agregar fotos o videos' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar información' }));
    await screen.findByText('No se pudo guardar la información.');
    await waitFor(() => expect(screen.getByLabelText('Sección de texto')).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Sección de texto'), { target: { value: 'description' } });
    expect(screen.getByLabelText('Descripción general')).toHaveValue('<p>Descripción nueva.</p>');
    expect(screen.getByLabelText('Correo de contacto')).toHaveValue('nuevo@example.test');
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ id, communityId, expectedVersion: 3,
      description: '<p>Descripción nueva.</p>', mission: '<p>Misión nueva.</p>', contactEmail: 'nuevo@example.test', isPublished: false }));
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it('publishes only after explicit selection and restores controls after success', async () => {
    mocks.save.mockResolvedValue({ ok: true, data: { id, version: 4 } });
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Editar información' }));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar información' }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ isPublished: true }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar información' })).toBeEnabled());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar información' })).toHaveFocus());
  });
  it('renders the founding date without timezone drift and hides editor tools from readers', () => {
    mount(false);
    expect(screen.getByText('1 de enero de 2020')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Sitio web (nueva pestaña)' })).toHaveAttribute('rel', 'noopener noreferrer nofollow');
    expect(screen.queryByRole('button', { name: 'Editar información' })).not.toBeInTheDocument();
    expect(screen.queryByText('Fotos y videos institucionales')).not.toBeInTheDocument();
  });
  it('offers only photos and videos in the institutional media picker', async () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Agregar fotos o videos' }));
    await screen.findByText(/No hay archivos disponibles/);
    expect(screen.getByLabelText('Tipo')).toHaveValue('image');
    expect(screen.queryByRole('option', { name: 'Documentos' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Videos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar información' })).toBeDisabled();
  });
});
