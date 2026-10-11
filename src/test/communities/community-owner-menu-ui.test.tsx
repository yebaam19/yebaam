import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import translations from '../../../messages/es/communities.json';
import { CommunityOwnerMenu } from '@/features/communities/components/CommunityOwnerMenu';
import { CommunitySidebar } from '@/features/communities/components/CommunitySidebar';

const mocks = vi.hoisted(() => ({ remove: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  usePathname: () => '/feed/comunidades/qa',
}));
vi.mock('@/features/communities/actions/update.actions', () => ({ deleteCommunity: mocks.remove }));

const communityId = '22222222-2222-4222-8222-222222222222';
function view() {
  return render(<NextIntlClientProvider locale="es" messages={{ communities: translations }}>
    <CommunityOwnerMenu communityId={communityId} communityName="Comunidad de prueba" />
  </NextIntlClientProvider>);
}
async function openConfirmation() {
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar comunidad' }));
  return screen.findByRole('dialog', { name: 'Eliminar comunidad' });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('CommunityOwnerMenu', () => {
  it('opens an accessible confirmation and cancels without deleting', async () => {
    view();
    const manage = screen.getByRole('button', { name: 'Eliminar comunidad' });
    expect(await openConfirmation()).toBeVisible();
    expect(screen.getByText(/Comunidad de prueba/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(manage).toHaveFocus());
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('shows the deletion control only in the creator sidebar', () => {
    const provider = (isOwner: boolean) => <NextIntlClientProvider locale="es" messages={{ communities: translations }}>
      <CommunitySidebar slug="qa" isOwner={isOwner} communityId={communityId} communityName="Comunidad de prueba" />
    </NextIntlClientProvider>;
    const view = render(provider(false));
    expect(screen.queryByRole('button', { name: 'Eliminar comunidad' })).not.toBeInTheDocument();
    view.rerender(provider(true));
    expect(screen.getByRole('button', { name: 'Eliminar comunidad' })).toBeVisible();
  });

  it('keeps the dialog open with an announced error after a failed delete', async () => {
    mocks.remove.mockResolvedValue({ ok: false, error: 'No se pudo eliminar la comunidad.' });
    view();
    await openConfirmation();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo eliminar la comunidad.');
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('returns to the communities list after the creator confirms a successful delete', async () => {
    mocks.remove.mockResolvedValue({ ok: true, data: { id: communityId } });
    view();
    await openConfirmation();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(communityId));
    expect(mocks.push).toHaveBeenCalledWith('/feed/comunidades');
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
});
