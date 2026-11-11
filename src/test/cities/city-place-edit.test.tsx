import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { expect, it, vi } from 'vitest'
import { CityPlaceForm } from '@/features/admin/components/cities/editor/CityPlaceForm'
import admin from '../../../messages/es/admin.json'

const { save, refresh } = vi.hoisted(() => ({ save: vi.fn(), refresh: vi.fn() }))
vi.mock('@/features/admin/actions/city-places.actions', () => ({ upsertCityPlace: save }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
vi.mock('@/lib/service/upload.service', () => ({ uploadService: { uploadImage: vi.fn() } }))

it('edits the selected place while preserving its city, image and moderation status', async () => {
  save.mockResolvedValue({ ok: true, data: { id: 'place-id' } })
  const place = { id: 'place-id', name: 'El Alamo', description: 'Historia', cfImageId: 'existing-image-id',
    imageUrl: undefined, category: 'Museo', latitude: 29.4, longitude: -98.5, address: 'Alamo Plaza',
    status: 'approved' as const, createdAt: '' }
  render(<NextIntlClientProvider locale="es" messages={{ admin }}><CityPlaceForm cityId="city-id" place={place} /></NextIntlClientProvider>)
  fireEvent.change(screen.getByPlaceholderText('Nombre del sitio'), { target: { value: 'El Álamo' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ placeId: 'place-id', cityId: 'city-id', name: 'El Álamo', cfImageId: 'existing-image-id', status: 'approved' }))
})
