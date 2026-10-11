import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import CommunityMembersError from '@/app/(app)/comunidades/[slug]/miembros/error';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key === 'loadError' ? 'No se pudo cargar la lista de miembros.' : 'Reintentar',
}));

it('announces failed reads and lets the user retry without changing hook order', async () => {
  const reset = vi.fn();
  const view = render(<CommunityMembersError reset={reset} />);
  expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar la lista de miembros.');
  await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(reset).toHaveBeenCalledTimes(1);
  view.rerender(<CommunityMembersError reset={reset} />);
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled();
});
