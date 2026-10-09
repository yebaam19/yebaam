import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SecretCommunityInvitations } from './SecretCommunityInvitations';
import { getMoreSecretCommunityInvitations } from '../actions/secretCommunityInvitations.actions';

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('../actions/secretCommunityInvitations.actions', () => ({
  getMoreSecretCommunityInvitations: vi.fn(),
}));

const first = {
  id: 'invite-1', communityId: 'community-1', communityName: 'Círculo privado',
  communitySlug: 'circulo-privado', createdAt: '2026-10-08T12:00:00Z',
};

describe('secret community invitation inbox', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps the section hidden when the recipient has no pending invitation', () => {
    const { container } = render(<SecretCommunityInvitations initialPage={{ items: [], nextCursor: null }} />);
    expect(container.firstChild).toBeNull();
  });

  it('links to review and loads the next page without accepting an invitation', async () => {
    vi.mocked(getMoreSecretCommunityInvitations).mockResolvedValue({
      ok: true,
      data: {
        items: [{ ...first, id: 'invite-2', communityName: 'Otro círculo', communitySlug: 'otro-circulo' }],
        nextCursor: null,
      },
    });
    render(<SecretCommunityInvitations initialPage={{ items: [first], nextCursor: 'cursor-1' }} />);

    const review = screen.getByRole('link', { name: 'review' });
    expect(review.getAttribute('href')).toBe('/feed/comunidades/circulo-privado');
    fireEvent.click(screen.getByRole('button', { name: 'more' }));
    await waitFor(() => expect(screen.getByText('Otro círculo')).toBeTruthy());
    expect(getMoreSecretCommunityInvitations).toHaveBeenCalledWith('cursor-1');
    expect(screen.queryByRole('button', { name: 'more' })).toBeNull();
  });
});
