import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ContactForm } from './ContactForm';
import { sendCityContactMessage } from '@/features/cities/actions/contact.actions';

vi.mock('@/features/cities/actions/contact.actions', () => ({
  sendCityContactMessage: vi.fn(),
}));

const messages = {
  cities: {
    contact: {
      form: {
        subjectLabel: 'Asunto (opcional)',
        subjectPlaceholder: 'Sugerencia...',
        bodyLabel: 'Mensaje',
        bodyPlaceholder: 'Cuéntanos...',
        submit: 'Enviar mensaje',
        submitting: 'Enviando...',
        success: 'Mensaje enviado.',
        errors: {
          bodyRequired: 'El mensaje no puede estar vacío.',
          submitFailed: 'No se pudo enviar.',
        },
        signInRequired: 'Inicia sesión para enviar.',
        signInCta: 'Iniciar sesión',
      },
    },
  },
};

function renderForm(currentUserId: string | null = 'user-1') {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ContactForm
        cityId="city-1"
        citySlug="popayan"
        currentUserId={currentUserId}
      />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ContactForm', () => {
  it('renders the subject and body fields plus the submit button', () => {
    renderForm('user-1');
    expect(screen.getByLabelText('Asunto (opcional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Mensaje')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar mensaje/i })).toBeInTheDocument();
  });

  it('shows a sign-in CTA in place of the submit button when no user is provided', () => {
    renderForm(null);
    // Form fields can still render so the user sees the destination shape,
    // but the submit button is replaced with the sign-in CTA.
    expect(screen.queryByRole('button', { name: /enviar mensaje/i })).not.toBeInTheDocument();
    const cta = screen.getByRole('link', { name: /iniciar sesión/i });
    expect(cta).toHaveAttribute('href', expect.stringContaining('/login'));
  });

  it('prevents submit when the body is empty', async () => {
    renderForm('user-1');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /enviar mensaje/i }));
    expect(sendCityContactMessage).not.toHaveBeenCalled();
    expect(screen.getByText('El mensaje no puede estar vacío.')).toBeInTheDocument();
  });

  it('submits with the right payload when filled', async () => {
    vi.mocked(sendCityContactMessage).mockResolvedValue({
      ok: true,
      data: { id: 'msg-1' },
    });
    renderForm('user-1');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Asunto (opcional)'), 'Hola admin');
    await user.type(screen.getByLabelText('Mensaje'), 'Mi mensaje');
    await user.click(screen.getByRole('button', { name: /enviar mensaje/i }));
    expect(sendCityContactMessage).toHaveBeenCalledTimes(1);
    expect(sendCityContactMessage).toHaveBeenCalledWith({
      cityId: 'city-1',
      subject: 'Hola admin',
      body: 'Mi mensaje',
    });
  });

  it('shows the success message after a successful submit', async () => {
    vi.mocked(sendCityContactMessage).mockResolvedValue({
      ok: true,
      data: { id: 'msg-1' },
    });
    renderForm('user-1');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Mensaje'), 'Mi mensaje');
    await user.click(screen.getByRole('button', { name: /enviar mensaje/i }));
    expect(await screen.findByText('Mensaje enviado.')).toBeInTheDocument();
  });
});
