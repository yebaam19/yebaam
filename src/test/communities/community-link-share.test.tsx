import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import translations from '../../../messages/es/communities.json';
import { CommunityLinkShareButton } from '@/features/communities/components/CommunityLinkShareButton';
import { CommunityArticleShareButton } from '@/features/communities/components/CommunityArticleShareButton';

const mocks = vi.hoisted(() => ({ publish: vi.fn(), refresh: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }) }));
vi.mock('@/features/communities/actions/communityArticles.actions', () => ({ shareCommunityArticleToFeed: mocks.publish }));
const copy = vi.fn();
let share: ReturnType<typeof vi.fn> | undefined;
const path = '/comunidades/musica/articulos/ritmos';
const title = 'Música & cultura #1';
const url = `${window.location.origin}${path}`;

beforeEach(() => {
  vi.clearAllMocks();
  share = undefined;
  copy.mockResolvedValue(undefined);
  const originalNavigator = window.navigator;
  vi.stubGlobal('navigator', new Proxy(originalNavigator, {
    get(target, key) {
      if (key === 'clipboard') return { writeText: copy };
      if (key === 'share') return share;
      return Reflect.get(target, key);
    },
  }));
});
afterEach(() => vi.unstubAllGlobals());

function view(isAuthor?: boolean) {
  render(<NextIntlClientProvider locale="es" messages={{ communities: translations }}>
    {isAuthor === undefined ? <CommunityLinkShareButton path={path} title={title} /> :
      <CommunityArticleShareButton articleId="article" articleTitle={title} articlePath={path}
        communitySlug="musica" isAuthor={isAuthor} />}
  </NextIntlClientProvider>);
}
async function open() {
  fireEvent.click(screen.getByRole('button', { name: 'Compartir enlace' }));
  await screen.findByRole('link', { name: /Compartir en WhatsApp/ });
}

describe('external community links', () => {
  it('offers encoded canonical links without publishing or copying on open', async () => {
    view();
    await open();
    expect(screen.getByRole('textbox', { name: 'Enlace' })).toHaveValue(url);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
    const destinations = links.map((link) => new URL(link.getAttribute('href')!));
    expect(destinations.map((link) => link.hostname)).toEqual(['wa.me', 'www.facebook.com', 'twitter.com', 't.me']);
    expect(destinations[0].searchParams.get('text')).toBe(`${title}\n${url}`);
    expect(destinations[1].searchParams.get('u')).toBe(url);
    for (const destination of destinations.slice(2)) {
      expect(destination.searchParams.get('url')).toBe(url);
      expect(destination.searchParams.get('text')).toBe(title);
    }
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(copy).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Más opciones…' })).toBeNull();
  });

  it('copies explicitly even when native sharing is available', async () => {
    share = vi.fn();
    view();
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Copiar enlace' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Enlace copiado.'));
    expect(copy).toHaveBeenCalledWith(url);
    expect(share).not.toHaveBeenCalled();
  });

  it('keeps a selectable link and actionable feedback when clipboard access fails', async () => {
    copy.mockRejectedValue(new Error('Denied'));
    view();
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Copiar enlace' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('cópialo manualmente'));
    expect(screen.getByRole('textbox', { name: 'Enlace' })).toHaveValue(url);
  });

  it('treats native cancellation as cancellation, and retains alternatives after failure', async () => {
    share = vi.fn().mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'))
      .mockRejectedValueOnce(new Error('Unavailable'));
    view();
    await open();
    const button = screen.getByRole('button', { name: 'Más opciones…' });
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeEnabled());
    expect(share).toHaveBeenCalledWith({ title, url });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(copy).not.toHaveBeenCalled();
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Elige una red o copia'));
    expect(screen.getByRole('link', { name: /Compartir en WhatsApp/ })).toBeVisible();
  });

  it('opens with the keyboard and returns focus on Escape', async () => {
    const user = userEvent.setup();
    view();
    const button = screen.getByRole('button', { name: 'Compartir enlace' });
    button.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('link', { name: /Compartir en WhatsApp/ });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('link')).toBeNull());
    expect(button).toHaveFocus();
  });

  it('lets readers share links while keeping feed publishing exclusive to the author', async () => {
    view(false);
    await open();
    expect(screen.queryByRole('button', { name: 'Compartir en la comunidad' })).toBeNull();
    expect(mocks.publish).not.toHaveBeenCalled();
  });

  it('preserves the author publishing dialog and displays server errors', async () => {
    mocks.publish.mockResolvedValue({ ok: false, error: 'No se pudo compartir el artículo.' });
    view(true);
    fireEvent.click(screen.getByRole('button', { name: 'Compartir en la comunidad' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Escucha estos ritmos' } });
    fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
    await screen.findByText('No se pudo compartir el artículo.');
    expect(mocks.publish).toHaveBeenCalledWith('article', 'Escucha estos ritmos', expect.any(String));
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
