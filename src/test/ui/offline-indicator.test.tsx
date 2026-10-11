import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import OfflineIndicator from '@/components/OfflineIndicator/OfflineIndicator';

const connection = vi.hoisted(() => ({ online: true }));
vi.mock('@/hooks/useOnlineStatus', () => ({ default: () => connection.online }));
vi.mock('@/components/icons/heroicons-shim', () => ({ SignalSlashIcon: () => null, WifiIcon: () => null }));
afterEach(() => { vi.useRealTimers(); connection.online = true; });

it('shows offline immediately and hides restored notice after three seconds, even after reconnecting twice', () => {
  vi.useFakeTimers();
  const { rerender } = render(<OfflineIndicator />);
  expect(screen.queryByText('Conexión restaurada')).toBeNull();
  connection.online = false;
  rerender(<OfflineIndicator />);
  expect(screen.getByText('Sin conexión a internet')).toBeInTheDocument();
  connection.online = true;
  rerender(<OfflineIndicator />);
  expect(screen.getByText('Conexión restaurada')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1500));
  connection.online = false;
  rerender(<OfflineIndicator />);
  connection.online = true;
  rerender(<OfflineIndicator />);
  act(() => vi.advanceTimersByTime(1500));
  expect(screen.getByText('Conexión restaurada')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1500));
  expect(screen.queryByText('Conexión restaurada')).toBeNull();
});
