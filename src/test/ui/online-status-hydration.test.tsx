// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import useOnlineStatus from '@/hooks/useOnlineStatus';

afterEach(() => vi.restoreAllMocks());
function Connection() { return <span>{useOnlineStatus() ? 'online' : 'offline'}</span>; }

it('renders a stable server snapshot even when navigator exists without onLine', () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(undefined as never);
  expect(renderToString(<Connection />)).toBe('<span>online</span>');
});

it('hydrates without rebuilding the tree even if the browser starts offline', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const container = document.createElement('div');
  container.innerHTML = renderToString(<Connection />);
  const serverNode = container.firstChild;
  const onRecoverableError = vi.fn();
  let root!: ReturnType<typeof hydrateRoot>;
  await act(async () => { root = hydrateRoot(container, <Connection />, { onRecoverableError }); });
  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(container.firstChild).toBe(serverNode);
  expect(container.textContent).toBe('offline');
  act(() => root.unmount());
});

it('updates connection status for online and offline events', () => {
  const connection = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  const { result, unmount } = renderHook(() => useOnlineStatus());
  expect(result.current).toBe(true);
  act(() => { connection.mockReturnValue(false); window.dispatchEvent(new Event('offline')); });
  expect(result.current).toBe(false);
  act(() => { connection.mockReturnValue(true); window.dispatchEvent(new Event('online')); });
  expect(result.current).toBe(true);
  unmount();
});
