import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CommunityAdminPanel } from './CommunityAdminPanel';
import { getMoreCommunityJoinRequests } from '../actions/communityJoinRequests.actions';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/features/communities/actions/join-requests.actions', () => ({
  approveJoinRequest: vi.fn(), declineJoinRequest: vi.fn(),
}));
vi.mock('@/features/communities/actions/moderation.actions', () => ({ inviteByUsername: vi.fn() }));
vi.mock('@/features/communities/actions/communityJoinRequests.actions', () => ({ getMoreCommunityJoinRequests: vi.fn() }));
vi.mock('./community-admin/AddCommunityMemberForm', () => ({
  AddCommunityMemberForm: () => <span>owner-add-member</span>,
}));
vi.mock('./community-admin/CommunityRoleManager', () => ({
  CommunityRoleManager: () => <span>owner-role-manager</span>,
}));

const request = {
  id: 'request-1', userId: 'applicant-1', username: 'applicant',
  name: 'Applicant', avatar: null, message: null, createdAt: '2026-10-09T00:00:00Z',
};

describe('community administration panel', () => {
  it('lets delegated admins review private requests without principal controls', () => {
    render(<CommunityAdminPanel communityId="community-1" privacy="PRIVATE"
      pendingRequests={{ items: [request], nextCursor: null }} rolePage={null} />);

    expect(screen.getByText('Applicant')).toBeTruthy();
    expect(screen.getByText('admin.panel.approve')).toBeTruthy();
    expect(screen.queryByText('owner-add-member')).toBeNull();
    expect(screen.queryByText('owner-role-manager')).toBeNull();
  });

  it('keeps principal controls available to the owner', () => {
    render(<CommunityAdminPanel communityId="community-1" privacy="PRIVATE"
      pendingRequests={{ items: [], nextCursor: null }} rolePage={{ items: [], nextCursor: null }} />);

    expect(screen.getByText('owner-add-member')).toBeTruthy();
    expect(screen.getByText('owner-role-manager')).toBeTruthy();
  });

  it('loads the next pending page without losing the current requests', async () => {
    vi.mocked(getMoreCommunityJoinRequests).mockResolvedValueOnce({ ok: true, data: {
      items: [{ ...request, id: 'request-2', name: 'Second applicant' }], nextCursor: null,
    } });
    render(<CommunityAdminPanel communityId="community-1" privacy="PRIVATE"
      pendingRequests={{ items: [request], nextCursor: 'next-page' }} rolePage={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'admin.panel.loadMore' }));
    await waitFor(() => expect(screen.getByText('Second applicant')).toBeTruthy());
    expect(screen.getByText('Applicant')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'admin.panel.loadMore' })).toBeNull();
  });
});
