import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { PublicChatPanel } from './PublicChatPanel';
import { sendCityPublicChatMessage } from '@/features/cities/actions/public-chat.actions';
import type { PublicChatMessage } from '@/features/cities/server/public-chat.server';

/**
 * jsdom-level component tests for the City Portal public chat panel.
 *
 * The realtime util is mocked so jsdom never tries to open a websocket;
 * the server action is mocked so we only verify the wire-up — the action's
 * own behaviour is covered by the server tests + the live browser run.
 */

vi.mock('@/utils/supabase/realtime', () => ({
  subscribeToTable: vi.fn(() => ({ topic: 'mock', state: 'joined' })),
  unsubscribe: vi.fn(),
}));

vi.mock('@/features/cities/actions/public-chat.actions', () => ({
  sendCityPublicChatMessage: vi.fn(),
}));

const baseMessages = {
  cities: {
    publicChat: {
      metadata: {
        title: 'Chat público — {city}',
        description: '',
      },
      header: {
        title: 'Chat público',
        subtitle: 'Conversación en vivo con la comunidad de {city}',
        capacity: '{count}/{max} en línea',
      },
      composer: {
        placeholder: 'Escribe un mensaje',
        send: 'Enviar',
        signedOut: 'Inicia sesión para participar',
        signInCta: 'Inicia sesión',
      },
      messages: {
        empty: 'Aún no hay mensajes. ¡Sé el primero en saludar!',
        you: 'Tú',
      },
    },
  },
};

function makeMsg(id: string, content: string, displayName = 'Alice'): PublicChatMessage {
  return {
    id,
    topic_id: 'topic-1',
    sender_id: `user-${id}`,
    content,
    created_at: new Date(Date.now() - 1000 * 60).toISOString(),
    is_deleted: false,
    sender_nickname: null,
    sender_avatar_url: null,
    author: {
      id: `user-${id}`,
      displayName,
      username: displayName.toLowerCase(),
      avatarUrl: null,
    },
  };
}

function renderPanel(props: {
  initialMessages?: PublicChatMessage[];
  currentUserId?: string | null;
}) {
  return render(
    <NextIntlClientProvider locale="es" messages={baseMessages}>
      <PublicChatPanel
        topicId="topic-1"
        cityName="Popayán"
        initialMessages={props.initialMessages ?? []}
        currentUserId={props.currentUserId ?? null}
        maxCapacity={250}
      />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PublicChatPanel', () => {
  it('renders all initial messages', () => {
    renderPanel({
      initialMessages: [makeMsg('1', 'Hola mundo', 'Alice'), makeMsg('2', 'Buen día', 'Bob')],
    });
    expect(screen.getByText('Hola mundo')).toBeInTheDocument();
    expect(screen.getByText('Buen día')).toBeInTheDocument();
  });

  it('shows the empty-state copy when there are no messages', () => {
    renderPanel({ initialMessages: [] });
    expect(
      screen.getByText('Aún no hay mensajes. ¡Sé el primero en saludar!'),
    ).toBeInTheDocument();
  });

  it('hides the composer and shows a sign-in CTA when unauthenticated', () => {
    renderPanel({ initialMessages: [makeMsg('1', 'Hola', 'Alice')], currentUserId: null });
    expect(screen.queryByPlaceholderText('Escribe un mensaje')).not.toBeInTheDocument();
    const link = screen.getByRole('link', { name: /inicia sesión/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('/login'));
  });

  it('renders the composer when authenticated and sends on click', async () => {
    vi.mocked(sendCityPublicChatMessage).mockResolvedValue({
      ok: true,
      data: { id: 'new-msg-id' },
    });
    renderPanel({
      initialMessages: [],
      currentUserId: '11111111-1111-1111-1111-111111111111',
    });
    const user = userEvent.setup();
    const textarea = screen.getByPlaceholderText('Escribe un mensaje');
    await user.type(textarea, 'Mensaje desde el test');
    const sendBtn = screen.getByRole('button', { name: /enviar/i });
    expect(sendBtn).not.toBeDisabled();
    await user.click(sendBtn);
    expect(sendCityPublicChatMessage).toHaveBeenCalledWith(
      'topic-1',
      'Mensaje desde el test',
    );
  });

  it('disables the send button when the composer is empty', () => {
    renderPanel({
      initialMessages: [],
      currentUserId: '11111111-1111-1111-1111-111111111111',
    });
    expect(screen.getByRole('button', { name: /enviar/i })).toBeDisabled();
  });
});
