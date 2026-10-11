import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { CommunityMembersPanel } from '@/features/communities/components/CommunityMembersPanel';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string, values?: { page?: number; pageCount?: number }) =>
    key === 'members.pageStatus' ? `Página ${values?.page} de ${values?.pageCount}` : key,
}));

it('links authorized staff to the previous and next member pages', async () => {
  render(await CommunityMembersPanel({ members: [], total: 121, page: 2, pageSize: 60, slug: 'qa' }));
  expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'members.previous' })).toHaveAttribute('href', '/feed/comunidades/qa/miembros');
  expect(screen.getByRole('link', { name: 'members.next' })).toHaveAttribute('href', '/feed/comunidades/qa/miembros?page=3');
});

it('never offers roster navigation in restricted mode', async () => {
  render(await CommunityMembersPanel({ members: [], total: 121, restricted: true, page: 2, slug: 'qa' }));
  expect(screen.queryByRole('navigation', { name: 'members.pagination' })).not.toBeInTheDocument();
});
