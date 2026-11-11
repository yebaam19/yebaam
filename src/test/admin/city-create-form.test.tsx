import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, it, vi } from 'vitest';
import { CityCreateForm } from '@/features/admin/components/cities/CityCreateForm';
import admin from '../../../messages/es/admin.json';

const { createCity, push } = vi.hoisted(() => ({ createCity: vi.fn(), push: vi.fn() }));
vi.mock('@/features/admin/actions/cities.actions', () => ({ createCity }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
const countries = [
  { id: 'us-id', code: 'US', name: 'Estados Unidos' },
  { id: 'es-id', code: 'ES', name: 'España' },
  { id: 'br-id', code: 'BR', name: 'Brasil' },
];

function fillForm() {
  render(<NextIntlClientProvider locale="es" messages={{ admin }}>
    <CityCreateForm countries={countries} />
  </NextIntlClientProvider>);
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'San José' } });
  fireEvent.change(screen.getByLabelText('País'), { target: { value: 'us-id' } });
}

beforeEach(() => vi.clearAllMocks());

it('submits the selected country and normalized city slug, then opens the editor', async () => {
  createCity.mockResolvedValue({ ok: true, data: { id: 'city-id', slug: 'san-jose' } });
  fillForm();
  expect(screen.getByRole('option', { name: 'España' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Brasil' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Crear ciudad' }));
  await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/ciudades/san-jose'));
  expect(createCity).toHaveBeenCalledWith({ name: 'San José', slug: 'san-jose', countryId: 'us-id' });
});

it('explains how to resolve a city address collision', async () => {
  createCity.mockResolvedValue({ ok: false, error: 'slug_taken' });
  fillForm();
  fireEvent.click(screen.getByRole('button', { name: 'Crear ciudad' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Añade el país o la región');
  expect(push).not.toHaveBeenCalled();
});

it('keeps the form usable after a rejected server request', async () => {
  createCity.mockRejectedValue(new Error('Network unavailable'));
  fillForm();
  fireEvent.click(screen.getByRole('button', { name: 'Crear ciudad' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo crear la ciudad.');
  expect(screen.getByRole('button', { name: 'Crear ciudad' })).toBeEnabled();
  expect(screen.getByLabelText('Nombre')).toHaveValue('San José');
});
