import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { FollowCityButton } from './FollowCityButton';
import { followCity } from '@/features/cities/actions/city.actions';

/**
 * Component tests for the optimistic Seguir / Siguiendo toggle.
 *
 * The server action module is mocked at the call boundary so the test never
 * touches the real Supabase project — it only verifies that the component
 * dispatches the right action and flips its label optimistically.
 *
 * `useRouter` from next/navigation is mocked so push/refresh are spies we
 * can introspect on the unauth path.
 */

const pushSpy = vi.fn();
const refreshSpy = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushSpy,
    refresh: refreshSpy,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/features/cities/actions/city.actions', () => ({
  followCity: vi.fn(),
  unfollowCity: vi.fn(),
}));

const messages = {
  cities: {
    portal: {
      follow: 'Seguir',
      following: 'Siguiendo',
      unfollow: 'Dejar de seguir',
    },
  },
};

function renderButton(initialFollowing: boolean) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <FollowCityButton
        cityId="11111111-1111-1111-1111-111111111111"
        citySlug="popayan"
        initialFollowing={initialFollowing}
      />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FollowCityButton', () => {
  it('renders "Seguir" when not following', () => {
    renderButton(false);
    expect(screen.getByRole('button', { name: /seguir/i })).toBeInTheDocument();
  });

  it('renders "Siguiendo" when already following', () => {
    renderButton(true);
    expect(
      screen.getByRole('button', { name: /dejar de seguir/i }),
    ).toBeInTheDocument();
  });

  it('calls followCity and flips to Siguiendo on click', async () => {
    vi.mocked(followCity).mockResolvedValue({ ok: true, data: { following: true } });
    renderButton(false);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /seguir/i }));
    expect(followCity).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
    expect(
      await screen.findByRole('button', { name: /dejar de seguir/i }),
    ).toBeInTheDocument();
  });

  it('redirects to /login when the action returns unauthenticated', async () => {
    vi.mocked(followCity).mockResolvedValue({ ok: false, error: 'unauthenticated' });
    renderButton(false);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /seguir/i }));
    expect(pushSpy).toHaveBeenCalledWith('/login?redirect=/cities/popayan');
  });
});
