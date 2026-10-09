import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FeedLayout from '@/app/(app)/feed/layout';

const route = vi.hoisted(() => ({ pathname: '/feed/comunidades' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('@/features/auth/context/auth-context', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/features/auth/context/current-user.context', () => ({ useOptionalCurrentUser: () => null }));
vi.mock('@/components/sidebar/hooks/useSidebar', () => ({ useSidebar: () => ({ isCollapsed: false }) }));
vi.mock('@/lib/hooks/useIsXl', () => ({ useIsXl: () => false }));
vi.mock('@/components/Header/SocialHeader', () => ({ default: () => <header /> }));
vi.mock('@/components/sidebar/Sidebar', () => ({ default: () => null }));
vi.mock('@/features/chat/context/chat-notification.context', () => ({
  ChatNotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('guest feed layout', () => {
  beforeEach(() => { route.pathname = '/feed/comunidades'; });

  it('renders public community content without a session', () => {
    render(<FeedLayout><p>Contenido público</p></FeedLayout>);
    expect(screen.getByText('Contenido público')).toBeTruthy();
  });

  it('keeps the ordinary feed hidden without a session', () => {
    route.pathname = '/feed';
    render(<FeedLayout><p>Contenido privado</p></FeedLayout>);
    expect(screen.queryByText('Contenido privado')).toBeNull();
  });
});
