import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommunityAccessPreview } from './CommunityAccessPreview';
import { joinCommunity, requestPrivateCommunityAccess } from '../actions/members.actions';

const refresh = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('../actions/members.actions', () => ({
  joinCommunity: vi.fn(), requestPrivateCommunityAccess: vi.fn(), cancelJoinRequest: vi.fn(),
}));

const base = { id: 'community-1', name: 'Organización invitada', slug: 'organizacion-invitada' };

describe('community access preview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts an invited secret community without showing a request button', async () => {
    vi.mocked(joinCommunity).mockResolvedValue({ ok: true, data: { id: base.id, outcome: 'invited_join' } });
    render(<CommunityAccessPreview community={{ ...base, privacy: 'SECRET' }}
      viewerState={{ kind: 'invited', invitationId: 'invite-1' }} />);

    expect(screen.getByText('privatePreview.invitedDescription')).toBeTruthy();
    expect(screen.queryByText('detail.joinButton.requestAccess')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'privatePreview.acceptInvite' }));
    await waitFor(() => expect(joinCommunity).toHaveBeenCalledWith(base.id));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('keeps the private-community request flow separate', async () => {
    vi.mocked(requestPrivateCommunityAccess).mockResolvedValue({ ok: true, data: { id: base.id } });
    render(<CommunityAccessPreview community={{ ...base, privacy: 'PRIVATE' }}
      viewerState={{ kind: 'none' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'detail.joinButton.requestAccess' }));
    await waitFor(() => expect(requestPrivateCommunityAccess).toHaveBeenCalledWith(base.id));
    expect(joinCommunity).not.toHaveBeenCalled();
  });

  it('hides admission when the invitation is no longer pending', () => {
    render(<CommunityAccessPreview community={{ ...base, privacy: 'SECRET' }}
      viewerState={{ kind: 'none' }} />);

    expect(screen.getByText('privatePreview.inviteUnavailable')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'privatePreview.acceptInvite' })).toBeNull();
  });
});
