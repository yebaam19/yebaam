/**
 * Datos Mock para Ciudades
 *
 * Simula la respuesta del backend mientras no existan los endpoints
 */

import { City, CityBasic, MediaType } from '../interfaces/city.interfaces'

/**
 * Lista de ciudades mock para el grid principal
 */
export const MOCK_CITIES: CityBasic[] = [
  {
    id: 'city-1',
    name: 'Medellín',
    state: { id: 'state-1', name: 'Antioquia' },
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'city-2',
    name: 'Bogotá',
    state: { id: 'state-2', name: 'Cundinamarca' },
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'city-3',
    name: 'Cali',
    state: { id: 'state-3', name: 'Valle del Cauca' },
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'city-4',
    name: 'Cartagena',
    state: { id: 'state-4', name: 'Bolívar' },
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'city-5',
    name: 'Barranquilla',
    state: { id: 'state-5', name: 'Atlántico' },
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'city-6',
    name: 'Santa Marta',
    state: { id: 'state-6', name: 'Magdalena' },
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'city-7',
    name: 'Bucaramanga',
    state: { id: 'state-7', name: 'Santander' },
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'city-8',
    name: 'Pereira',
    state: { id: 'state-8', name: 'Risaralda' },
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'city-9',
    name: 'Manizales',
    state: { id: 'state-9', name: 'Caldas' },
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'city-10',
    name: 'Cúcuta',
    state: { id: 'state-10', name: 'Norte de Santander' },
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'city-11',
    name: 'Ibagué',
    state: { id: 'state-11', name: 'Tolima' },
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'city-12',
    name: 'Villavicencio',
    state: { id: 'state-12', name: 'Meta' },
    country: { id: 'country-1', name: 'Colombia' },
  },
]

/**
 * Detalle de ciudad mock con media
 */
export const MOCK_CITY_DETAIL: Record<string, City> = {
  medellin: {
    id: 'city-1',
    name: 'Medellín',
    stateId: 'state-1',
    countryId: 'country-1',
    state: { id: 'state-1', name: 'Antioquia', countryId: 'country-1' },
    country: { id: 'country-1', name: 'Colombia', code: 'CO' },
    cityMedia: [
      {
        id: 'media-1',
        cityId: 'city-1',
        userId: 'user-1',
        url: 'https://images.pexels.com/photos/2549018/pexels-photo-2549018.jpeg',
        type: MediaType.IMAGE,
        createdAt: new Date().toISOString(),
        likesCount: 42,
        isLikedByUser: false,
        user: {
          id: 'user-1',
          username: 'juanperez',
          firstName: 'Juan',
          lastName: 'Pérez',
          avatarUrl: 'https://i.pravatar.cc/150?u=user1',
        },
      },
      {
        id: 'media-2',
        cityId: 'city-1',
        userId: 'user-2',
        url: 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg',
        type: MediaType.IMAGE,
        createdAt: new Date().toISOString(),
        likesCount: 28,
        isLikedByUser: true,
        user: {
          id: 'user-2',
          username: 'mariagomez',
          firstName: 'María',
          lastName: 'Gómez',
          avatarUrl: 'https://i.pravatar.cc/150?u=user2',
        },
      },
      {
        id: 'media-3',
        cityId: 'city-1',
        userId: 'user-3',
        url: 'https://images.pexels.com/photos/3889843/pexels-photo-3889843.jpeg',
        type: MediaType.IMAGE,
        createdAt: new Date().toISOString(),
        likesCount: 15,
        isLikedByUser: false,
        user: {
          id: 'user-3',
          username: 'carlosrod',
          firstName: 'Carlos',
          lastName: 'Rodríguez',
          avatarUrl: 'https://i.pravatar.cc/150?u=user3',
        },
      },
    ],
  },
  bogota: {
    id: 'city-2',
    name: 'Bogotá',
    stateId: 'state-2',
    countryId: 'country-1',
    state: { id: 'state-2', name: 'Cundinamarca', countryId: 'country-1' },
    country: { id: 'country-1', name: 'Colombia', code: 'CO' },
    cityMedia: [
      {
        id: 'media-4',
        cityId: 'city-2',
        userId: 'user-1',
        url: 'https://images.pexels.com/photos/2310713/pexels-photo-2310713.jpeg',
        type: MediaType.IMAGE,
        createdAt: new Date().toISOString(),
        likesCount: 55,
        isLikedByUser: false,
        user: {
          id: 'user-1',
          username: 'juanperez',
          firstName: 'Juan',
          lastName: 'Pérez',
          avatarUrl: 'https://i.pravatar.cc/150?u=user1',
        },
      },
    ],
  },
  cali: {
    id: 'city-3',
    name: 'Cali',
    stateId: 'state-3',
    countryId: 'country-1',
    state: { id: 'state-3', name: 'Valle del Cauca', countryId: 'country-1' },
    country: { id: 'country-1', name: 'Colombia', code: 'CO' },
    cityMedia: [],
  },
  cartagena: {
    id: 'city-4',
    name: 'Cartagena',
    stateId: 'state-4',
    countryId: 'country-1',
    state: { id: 'state-4', name: 'Bolívar', countryId: 'country-1' },
    country: { id: 'country-1', name: 'Colombia', code: 'CO' },
    cityMedia: [
      {
        id: 'media-5',
        cityId: 'city-4',
        userId: 'user-2',
        url: 'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg',
        type: MediaType.IMAGE,
        createdAt: new Date().toISOString(),
        likesCount: 89,
        isLikedByUser: true,
        user: {
          id: 'user-2',
          username: 'mariagomez',
          firstName: 'María',
          lastName: 'Gómez',
          avatarUrl: 'https://i.pravatar.cc/150?u=user2',
        },
      },
    ],
  },
}

/**
 * Función helper para obtener ciudad por slug
 */
export function getMockCityBySlug(slug: string): City | undefined {
  return MOCK_CITY_DETAIL[slug.toLowerCase()]
}

/**
 * Función helper para generar ciudad mock si no existe
 */
export function getOrCreateMockCity(slug: string, cityName: string): City {
  const existing = getMockCityBySlug(slug)
  if (existing) return existing

  // Generar ciudad mock genérica
  return {
    id: `city-${slug}`,
    name: cityName,
    countryId: 'country-1',
    country: { id: 'country-1', name: 'Colombia', code: 'CO' },
    cityMedia: [],
  }
}
