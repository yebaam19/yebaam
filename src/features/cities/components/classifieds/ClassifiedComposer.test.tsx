import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ClassifiedComposer } from './ClassifiedComposer';
import { postClassified } from '@/features/cities/actions/classifieds.actions';

/**
 * jsdom tests for the multi-image classified composer. The action and the
 * upload service are both mocked so we only verify the wire-up between the
 * UI and the action — the server tests cover the action's behaviour, and
 * the live browser run covers Cloudflare.
 */

vi.mock('@/features/cities/actions/classifieds.actions', () => ({
  postClassified: vi.fn(),
}));

vi.mock('@/lib/service/upload.service', () => ({
  uploadService: {
    uploadImage: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const messages = {
  cities: {
    classifieds: {
      composer: {
        title: 'Publicar un clasificado',
        fields: {
          titleLabel: 'Título',
          titlePlaceholder: 'Bicicleta, perro perdido...',
          kindLabel: 'Tipo',
          priceLabel: 'Precio (opcional)',
          pricePlaceholder: '0',
          descriptionLabel: 'Descripción',
          descriptionPlaceholder: 'Detalles...',
          imagesLabel: 'Imágenes',
          imagesHint: 'Añade hasta 6 fotos',
        },
        actions: {
          submit: 'Publicar',
          submitting: 'Publicando...',
          cancel: 'Cancelar',
          removeImage: 'Quitar imagen',
        },
        errors: {
          titleRequired: 'El título es obligatorio.',
          invalidPrice: 'El precio debe ser un número válido.',
          uploadFailed: 'No se pudo subir la imagen.',
          submitFailed: 'No se pudo publicar el clasificado.',
        },
        signInRequired: 'Inicia sesión para publicar.',
        signInCta: 'Iniciar sesión',
      },
      kinds: {
        offer: 'Vendo',
        want: 'Busco',
        trade: 'Intercambio',
        free: 'Regalo',
      },
    },
  },
};

function renderComposer(currentUserId: string | null = 'user-1') {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ClassifiedComposer
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

describe('ClassifiedComposer', () => {
  it('renders all primary fields when signed in', () => {
    renderComposer('user-1');
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByLabelText('Precio (opcional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publicar/i })).toBeInTheDocument();
  });

  it('shows a sign-in CTA in place of the form when no user is provided', () => {
    renderComposer(null);
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
    const cta = screen.getByRole('link', { name: /iniciar sesión/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', expect.stringContaining('/login'));
  });

  it('lets the user pick a kind via the dropdown', async () => {
    renderComposer('user-1');
    const select = screen.getByLabelText('Tipo') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    const user = userEvent.setup();
    await user.selectOptions(select, 'want');
    expect(select.value).toBe('want');
  });

  it('does not call postClassified when the title is empty', async () => {
    renderComposer('user-1');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /publicar/i }));
    expect(postClassified).not.toHaveBeenCalled();
  });

  it('submits with the right payload shape', async () => {
    vi.mocked(postClassified).mockResolvedValue({ ok: true, data: { id: 'new-id' } });
    renderComposer('user-1');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Título'), 'Bici de prueba');
    await user.type(screen.getByLabelText('Descripción'), 'En buen estado');
    await user.type(screen.getByLabelText('Precio (opcional)'), '120000');
    await user.click(screen.getByRole('button', { name: /publicar/i }));
    expect(postClassified).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(postClassified).mock.calls[0][0];
    expect(payload).toMatchObject({
      cityId: 'city-1',
      title: 'Bici de prueba',
      description: 'En buen estado',
      kind: 'offer',
      priceCents: 12_000_000,
    });
    expect(Array.isArray(payload.cfImageIds)).toBe(true);
  });
});
