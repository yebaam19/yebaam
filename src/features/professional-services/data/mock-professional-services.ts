/**
 * Mock data para Servicios Profesionales
 *
 * Datos de ejemplo para desarrollo y testing
 * Incluye múltiples ciudades y departamentos para filtros
 */

import {
  City,
  ProfessionalService,
  ProfessionalServiceBasic,
  ProfessionalServiceCategory,
  ProfessionalServiceMedia,
  ProfessionalServiceReview,
  ProfessionalServiceStatus,
  ProfessionalServiceVisibility,
  ServiceCity,
  ServiceMediaType,
  State,
} from '../interfaces/professional-service.interfaces'
import { SERVICE_CATEGORIES, findCategoryById } from './service-categories-taxonomy'

// ============================================================================
// ESTADOS/DEPARTAMENTOS
// ============================================================================

export const MOCK_STATES: State[] = [
  {
    id: 'state-1',
    name: 'Cundinamarca',
    slug: 'cundinamarca',
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'state-2',
    name: 'Antioquia',
    slug: 'antioquia',
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'state-3',
    name: 'Valle del Cauca',
    slug: 'valle-del-cauca',
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'state-4',
    name: 'Atlántico',
    slug: 'atlantico',
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'state-5',
    name: 'Santander',
    slug: 'santander',
    country: { id: 'country-1', name: 'Colombia' },
  },
  {
    id: 'state-6',
    name: 'Bolívar',
    slug: 'bolivar',
    country: { id: 'country-1', name: 'Colombia' },
  },
]

// ============================================================================
// CIUDADES
// ============================================================================

export const MOCK_CITIES: City[] = [
  // Cundinamarca
  {
    id: 'city-1',
    name: 'Bogotá',
    slug: 'bogota',
    stateId: 'state-1',
    state: MOCK_STATES[0],
  },
  {
    id: 'city-2',
    name: 'Zipaquirá',
    slug: 'zipaquira',
    stateId: 'state-1',
    state: MOCK_STATES[0],
  },
  // Antioquia
  {
    id: 'city-3',
    name: 'Medellín',
    slug: 'medellin',
    stateId: 'state-2',
    state: MOCK_STATES[1],
  },
  {
    id: 'city-4',
    name: 'Envigado',
    slug: 'envigado',
    stateId: 'state-2',
    state: MOCK_STATES[1],
  },
  // Valle del Cauca
  {
    id: 'city-5',
    name: 'Cali',
    slug: 'cali',
    stateId: 'state-3',
    state: MOCK_STATES[2],
  },
  {
    id: 'city-6',
    name: 'Palmira',
    slug: 'palmira',
    stateId: 'state-3',
    state: MOCK_STATES[2],
  },
  // Atlántico
  {
    id: 'city-7',
    name: 'Barranquilla',
    slug: 'barranquilla',
    stateId: 'state-4',
    state: MOCK_STATES[3],
  },
  // Santander
  {
    id: 'city-8',
    name: 'Bucaramanga',
    slug: 'bucaramanga',
    stateId: 'state-5',
    state: MOCK_STATES[4],
  },
  // Bolívar
  {
    id: 'city-9',
    name: 'Cartagena',
    slug: 'cartagena',
    stateId: 'state-6',
    state: MOCK_STATES[5],
  },
]

// Helper para obtener ServiceCity desde City
const getServiceCity = (cityId: string): ServiceCity => {
  const city = MOCK_CITIES.find((c) => c.id === cityId)!
  return {
    id: city.id,
    name: city.name,
    slug: city.slug,
    state: city.state
      ? {
          id: city.state.id,
          name: city.state.name,
        }
      : undefined,
    country: city.state?.country ?? { id: 'country-1', name: 'Colombia' },
  }
}

// ============================================================================
// CATEGORÍAS — taxonomía del PDF (fuente única: service-categories-taxonomy.ts)
// ============================================================================

// Re-exporta las categorías de la taxonomía como fuente de datos mock.
export { SERVICE_CATEGORIES }

/** Resuelve una categoría padre por id para los servicios mock. */
const cat = (id: string): ProfessionalServiceCategory => {
  const found = findCategoryById(id)
  if (!found) throw new Error(`[mock] Categoría no encontrada: ${id}`)
  return found
}

// ============================================================================
// MOCK USERS (Owners)
// ============================================================================

const MOCK_SERVICE_OWNERS = {
  owner1: {
    id: 'user-srv-1',
    username: 'martinez_abogados',
    firstName: 'Roberto',
    lastName: 'Martínez',
    avatarUrl: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=150',
    email: 'roberto@martinezabogados.com',
    isVerified: true,
  },
  owner2: {
    id: 'user-srv-2',
    username: 'juridico_lopez',
    firstName: 'María',
    lastName: 'López',
    avatarUrl: 'https://images.pexels.com/photos/5669602/pexels-photo-5669602.jpeg?auto=compress&cs=tinysrgb&w=150',
    email: 'maria@juridicolopez.com',
    isVerified: true,
  },
  owner3: {
    id: 'user-srv-3',
    username: 'conta_express',
    firstName: 'Carlos',
    lastName: 'Sánchez',
    avatarUrl: 'https://images.pexels.com/photos/6863250/pexels-photo-6863250.jpeg?auto=compress&cs=tinysrgb&w=150',
    email: 'carlos@contabilidadexpress.com',
    isVerified: false,
  },
  owner4: {
    id: 'user-srv-4',
    username: 'estudio_moderno',
    firstName: 'Ana',
    lastName: 'Gómez',
    avatarUrl: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=150',
    email: 'ana@estudiomoderno.com',
    isVerified: true,
  },
  owner5: {
    id: 'user-srv-5',
    username: 'dr_ramirez',
    firstName: 'Carlos',
    lastName: 'Ramírez',
    avatarUrl: 'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?auto=compress&cs=tinysrgb&w=150',
    email: 'carlos.ramirez@clinica.com',
    isVerified: true,
  },
  owner6: {
    id: 'user-srv-6',
    username: 'devcode_pro',
    firstName: 'Andrés',
    lastName: 'Torres',
    avatarUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
    email: 'andres@devcodepro.com',
    isVerified: true,
  },
  owner7: {
    id: 'user-srv-7',
    username: 'foto_studio',
    firstName: 'Valentina',
    lastName: 'Ruiz',
    avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    email: 'valentina@fotostudio.com',
    isVerified: true,
  },
  owner8: {
    id: 'user-srv-8',
    username: 'psi_bienestar',
    firstName: 'Laura',
    lastName: 'Mendoza',
    avatarUrl: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=150',
    email: 'laura@psibienestar.com',
    isVerified: true,
  },
  owner9: {
    id: 'user-srv-9',
    username: 'electrico_pro',
    firstName: 'Jorge',
    lastName: 'Díaz',
    avatarUrl: 'https://images.pexels.com/photos/8961065/pexels-photo-8961065.jpeg?auto=compress&cs=tinysrgb&w=150',
    email: 'jorge@electricopro.com',
    isVerified: false,
  },
  owner10: {
    id: 'user-srv-10',
    username: 'diseno_creativo',
    firstName: 'Camila',
    lastName: 'Vargas',
    avatarUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
    email: 'camila@disenocreativo.com',
    isVerified: true,
  },
}

// ============================================================================
// MOCK MEDIA (Por servicio)
// ============================================================================

const createServiceMedia = (serviceId: string, count: number): ProfessionalServiceMedia[] => {
  const images = [
    'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800',
  ]

  return Array.from({ length: Math.min(count, images.length) }, (_, i) => ({
    id: `media-${serviceId}-${i + 1}`,
    serviceId,
    type: ServiceMediaType.IMAGE,
    url: images[i],
    caption: `Imagen ${i + 1} del servicio`,
    order: i,
    createdAt: '2024-06-15T10:00:00Z',
  }))
}

// ============================================================================
// MOCK REVIEWS
// ============================================================================

const createServiceReviews = (serviceId: string): ProfessionalServiceReview[] => {
  const reviewers = [
    {
      id: 'reviewer-1',
      username: 'juan_cliente',
      firstName: 'Juan',
      lastName: 'Pérez',
      avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    {
      id: 'reviewer-2',
      username: 'laura_m',
      firstName: 'Laura',
      lastName: 'Morales',
      avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    {
      id: 'reviewer-3',
      username: 'pedro_g',
      firstName: 'Pedro',
      lastName: 'García',
      avatarUrl: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
  ]

  const comments = [
    'Excelente servicio, muy profesional y puntual. Totalmente recomendado.',
    'Muy buen trabajo, quedé satisfecho con los resultados. Volveré a contratar.',
    'Profesional de primera. Atención personalizada y precios justos.',
  ]

  const ratings = [5, 4, 5]

  return reviewers.map((reviewer, i) => ({
    id: `review-${serviceId}-${i + 1}`,
    serviceId,
    userId: reviewer.id,
    rating: ratings[i],
    comment: comments[i],
    createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    user: reviewer,
  }))
}

// ============================================================================
// SERVICIOS PROFESIONALES COMPLETOS
// ============================================================================

export const MOCK_PROFESSIONAL_SERVICES_FULL: ProfessionalService[] = [
  // -------------------- BOGOTÁ --------------------
  {
    id: 'srv-1',
    name: 'Abogados Martínez & Asociados',
    slug: 'abogados-martinez-asociados',
    description: `Somos un bufete de abogados con más de 20 años de experiencia en derecho civil, comercial y laboral.

Nuestro equipo de profesionales altamente calificados está comprometido con brindar soluciones legales efectivas y personalizadas para cada uno de nuestros clientes.

**Áreas de práctica:**
- Derecho Civil y Familiar
- Derecho Comercial y Corporativo
- Derecho Laboral
- Derecho Penal
- Propiedad Intelectual

Ofrecemos consultas gratuitas para evaluar su caso.`,
    logoUrl: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=200',
    coverUrl: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=1200',
    adImageUrl: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=800',
    email: 'contacto@martinezabogados.com',
    phone: '+57 300 123 4567',
    website: 'https://martinezabogados.com',
    address: 'Torre Empresarial, Oficina 1201, Bogotá',
    visibility: ProfessionalServiceVisibility.PUBLIC,
    status: ProfessionalServiceStatus.ACTIVE,
    facebookUrl: 'https://facebook.com/martinezabogados',
    instagramUrl: 'https://instagram.com/martinezabogados',
    linkedinUrl: 'https://linkedin.com/company/martinezabogados',
    hourlyRate: 150000,
    dailyRate: 1000000,
    projectRate: 5000000,
    currency: 'COP',
    availableForHire: true,
    workType: ['on-site', 'remote'],
    userId: MOCK_SERVICE_OWNERS.owner1.id,
    cityId: 'city-1', // Bogotá
    categoryId: 'cat-servicios-legales',
    tags: ['abogados', 'derecho civil', 'derecho comercial', 'derecho laboral'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-01T15:30:00Z',
    user: MOCK_SERVICE_OWNERS.owner1,
    city: getServiceCity('city-1'),
    category: cat('cat-servicios-legales'),
    media: createServiceMedia('srv-1', 5),
    reviews: createServiceReviews('srv-1'),
    _count: { media: 5, reviews: 38 },
    averageRating: 4.8,
  },
  {
    id: 'srv-2',
    name: 'Consultorio Jurídico López',
    slug: 'consultorio-juridico-lopez',
    description: `Asesoría legal integral para empresas y particulares. Nos especializamos en resolver conflictos de manera efectiva.

**Nuestros servicios incluyen:**
- Asesoría legal preventiva
- Representación judicial
- Contratos y acuerdos
- Mediación y arbitraje

Más de 15 años de experiencia nos respaldan.`,
    logoUrl: 'https://images.pexels.com/photos/5669602/pexels-photo-5669602.jpeg?auto=compress&cs=tinysrgb&w=200',
    coverUrl: 'https://images.pexels.com/photos/5669602/pexels-photo-5669602.jpeg?auto=compress&cs=tinysrgb&w=1200',
    adImageUrl: 'https://images.pexels.com/photos/5669602/pexels-photo-5669602.jpeg?auto=compress&cs=tinysrgb&w=800',
    email: 'info@juridicolopez.com',
    phone: '+57 310 987 6543',
    website: 'https://juridicolopez.com',
    address: 'Edificio Central, Piso 8, Bogotá',
    visibility: ProfessionalServiceVisibility.PUBLIC,
    status: ProfessionalServiceStatus.ACTIVE,
    facebookUrl: 'https://facebook.com/juridicolopez',
    hourlyRate: 120000,
    currency: 'COP',
    availableForHire: true,
    workType: ['on-site'],
    userId: MOCK_SERVICE_OWNERS.owner2.id,
    cityId: 'city-1', // Bogotá
    categoryId: 'cat-servicios-legales',
    tags: ['abogados', 'asesoría legal', 'contratos'],
    createdAt: '2024-02-20T14:00:00Z',
    updatedAt: '2024-11-15T10:00:00Z',
    user: MOCK_SERVICE_OWNERS.owner2,
    city: getServiceCity('city-1'),
    category: cat('cat-servicios-legales'),
    media: createServiceMedia('srv-2', 3),
    reviews: createServiceReviews('srv-2'),
    _count: { media: 3, reviews: 25 },
    averageRating: 4.6,
  },
  {
    id: 'srv-3',
    name: 'Contabilidad Express',
    slug: 'contabilidad-express',
    description: `Servicios contables y tributarios para empresas de todos los tamaños.

**Ofrecemos:**
- Contabilidad general
- Declaración de impuestos
- Nómina y prestaciones sociales
- Auditoría financiera
- Asesoría tributaria

Tecnología de punta para optimizar sus procesos contables.`,
    logoUrl: 'https://images.pexels.com/photos/6863250/pexels-photo-6863250.jpeg?auto=compress&cs=tinysrgb&w=200',
    coverUrl: 'https://images.pexels.com/photos/6863250/pexels-photo-6863250.jpeg?auto=compress&cs=tinysrgb&w=1200',
    adImageUrl: 'https://images.pexels.com/photos/6863250/pexels-photo-6863250.jpeg?auto=compress&cs=tinysrgb&w=800',
    email: 'info@contabilidadexpress.com',
    phone: '+57 315 456 7890',
    address: 'Centro Empresarial Norte, Local 502, Bogotá',
    visibility: ProfessionalServiceVisibility.PUBLIC,
    status: ProfessionalServiceStatus.ACTIVE,
    linkedinUrl: 'https://linkedin.com/company/contabilidadexpress',
    hourlyRate: 80000,
    dailyRate: 500000,
    currency: 'COP',
    availableForHire: true,
    workType: ['remote', 'on-site'],
    userId: MOCK_SERVICE_OWNERS.owner3.id,
    cityId: 'city-1', // Bogotá
    categoryId: 'cat-finanzas-y-contabilidad',
    tags: ['contadores', 'contabilidad', 'impuestos', 'nómina'],
    createdAt: '2024-03-10T09:00:00Z',
    updatedAt: '2024-12-10T12:00:00Z',
    user: MOCK_SERVICE_OWNERS.owner3,
    city: getServiceCity('city-1'),
    category: cat('cat-finanzas-y-contabilidad'),
    media: createServiceMedia('srv-3', 2),
    reviews: createServiceReviews('srv-3'),
    _count: { media: 2, reviews: 42 },
    averageRating: 4.7,
  },

  // -------------------- MEDELLÍN --------------------
  {
    id: 'srv-4',
    name: 'Estudio Arquitectónico Moderno',
    slug: 'estudio-arquitectonico-moderno',
    description: `Diseño arquitectónico contemporáneo que fusiona funcionalidad, estética y sostenibilidad.

**Servicios:**
- Diseño arquitectónico residencial y comercial
- Remodelaciones y ampliaciones
- Diseño de interiores
- Paisajismo
- Gestión de proyectos

Cada proyecto es único, diseñado a la medida de sus necesidades.`,
    logoUrl: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=200',
    coverUrl: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200',
    adImageUrl: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
    email: 'proyectos@estudiomoderno.com',
    phone: '+57 320 111 2233',
    website: 'https://estudiomoderno.com',
    address: 'El Poblado, Calle 10 #25-30, Medellín',
    visibility: ProfessionalServiceVisibility.PUBLIC,
    status: ProfessionalServiceStatus.ACTIVE,
    instagramUrl: 'https://instagram.com/estudiomoderno',
    hourlyRate: 200000,
    projectRate: 15000000,
    currency: 'COP',
    availableForHire: true,
    workType: ['on-site', 'hybrid'],
    userId: MOCK_SERVICE_OWNERS.owner4.id,
    cityId: 'city-3', // Medellín
    categoryId: 'cat-arquitectura-y-construccion',
    tags: ['arquitectura', 'diseño', 'construcción', 'interiores'],
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-12-05T16:00:00Z',
    user: MOCK_SERVICE_OWNERS.owner4,
    city: getServiceCity('city-3'),
    category: cat('cat-arquitectura-y-construccion'),
    media: createServiceMedia('srv-4', 6),
    reviews: createServiceReviews('srv-4'),
    _count: { media: 45, reviews: 29 },
    averageRating: 4.9,
  },
  {
    id: 'srv-5',
    name: 'DevCode Pro - Desarrollo de Software',
    slug: 'devcode-pro-desarrollo-software',
    description: `Agencia de desarrollo de software especializada en soluciones web y móviles.

**Servicios:**
- Desarrollo web (React, Next.js, Vue)
- Aplicaciones móviles (React Native, Flutter)
- Backend y APIs (Node.js, Python, Go)
- DevOps y Cloud (AWS, GCP, Azure)
- Consultoría tecnológica

Entregamos productos digitales de alta calidad.`,
    logoUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200',
    coverUrl: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1200',
    adImageUrl: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800',
    email: 'hola@devcodepro.com',
    phone: '+57 304 222 3344',
    website: 'https://devcodepro.com',
    address: 'Laureles, Circular 75 #39-15, Medellín',
    visibility: ProfessionalServiceVisibility.PUBLIC,
    status: ProfessionalServiceStatus.ACTIVE,
    linkedinUrl: 'https://linkedin.com/company/devcodepro',
    instagramUrl: 'https://instagram.com/devcodepro',
    twitterUrl: 'https://twitter.com/devcodepro',
    hourlyRate: 180000,
    dailyRate: 1200000,
    projectRate: 20000000,
    currency: 'COP',
    availableForHire: true,
    workType: ['remote', 'hybrid'],
    userId: MOCK_SERVICE_OWNERS.owner6.id,
    cityId: 'city-3', // Medellín
    categoryId: 'cat-tecnologia-e-informatica',
    tags: ['desarrollo', 'software', 'web', 'móvil', 'react', 'nextjs'],
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-12-18T10:00:00Z',
    user: MOCK_SERVICE_OWNERS.owner6,
    city: getServiceCity('city-3'),
    category: cat('cat-tecnologia-e-informatica'),
    media: createServiceMedia('srv-5', 5),
    reviews: createServiceReviews('srv-5'),
    _count: { media: 12, reviews: 56 },
    averageRating: 4.85,
  },

  // -------------------- CALI --------------------
  {
    id: 'srv-6',
    name: 'Dr. Carlos Ramírez - Cardiólogo',
    slug: 'dr-carlos-ramirez-cardiologo',
    description: `Especialista en cardiología y medicina interna con más de 25 años de experiencia.

**Especialidades:**
- Cardiología clínica
- Ecocardiografía
- Electrocardiografía
- Pruebas de esfuerzo
- Holter y MAPA

Atención personalizada y tecnología de última generación.`,
    logoUrl: 'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?auto=compress&cs=tinysrgb&w=200',
    coverUrl: 'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?auto=compress&cs=tinysrgb&w=1200',
    adImageUrl: 'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?auto=compress&cs=tinysrgb&w=800',
    email: 'citas@drcarlosramirez.com',
    phone: '+57 301 555 6666',
    website: 'https://drcarlosramirez.com',
    address: 'Clínica del Valle, Consultorio 305, Cali',
    visibility: ProfessionalServiceVisibility.PUBLIC,
    status: ProfessionalServiceStatus.ACTIVE,
    linkedinUrl: 'https://linkedin.com/in/drcarlosramirez',
    hourlyRate: 250000,
    currency: 'COP',
    availableForHire: true,
    workType: ['on-site'],
    userId: MOCK_SERVICE_OWNERS.owner5.id,
    cityId: 'city-5', // Cali
    categoryId: 'cat-salud',
    tags: ['médico', 'cardiólogo', 'salud', 'corazón'],
    createdAt: '2023-06-01T08:00:00Z',
    updatedAt: '2024-12-15T09:00:00Z',
    user: MOCK_SERVICE_OWNERS.owner5,
    city: getServiceCity('city-5'),
    category: cat('cat-salud'),
    media: createServiceMedia('srv-6', 4),
    reviews: createServiceReviews('srv-6'),
    _count: { media: 8, reviews: 87 },
    averageRating: 4.95,
  },
  {
    id: 'srv-7',
    name: 'FotoStudio Valentina',
    slug: 'fotostudio-valentina',
    description: `Fotografía profesional para todos tus momentos especiales.

**Servicios:**
- Fotografía de bodas y eventos
- Sesiones de retrato
- Fotografía corporativa
- Product photography
- Edición profesional

Capturamos tus recuerdos con arte y pasión.`,
    logoUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
    coverUrl: 'https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?auto=compress&cs=tinysrgb&w=1200',
    adImageUrl: 'https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?auto=compress&cs=tinysrgb&w=800',
    email: 'contacto@fotostudiovalentina.com',
    phone: '+57 318 777 8899',
    website: 'https://fotostudiovalentina.com',
    address: 'Ciudad Jardín, Calle 15 #100-50, Cali',
    visibility: ProfessionalServiceVisibility.PUBLIC,
    status: ProfessionalServiceStatus.ACTIVE,
    instagramUrl: 'https://instagram.com/fotostudiovalentina',
    facebookUrl: 'https://facebook.com/fotostudiovalentina',
    hourlyRate: 120000,
    projectRate: 2500000,
    currency: 'COP',
    availableForHire: true,
    workType: ['on-site', 'hybrid'],
    userId: MOCK_SERVICE_OWNERS.owner7.id,
    cityId: 'city-5', // Cali
    categoryId: 'cat-diseno-y-creatividad',
    tags: ['fotografía', 'bodas', 'eventos', 'retratos'],
    createdAt: '2024-04-15T10:00:00Z',
    updatedAt: '2024-12-10T14:00:00Z',
    user: MOCK_SERVICE_OWNERS.owner7,
    city: getServiceCity('city-5'),
    category: cat('cat-diseno-y-creatividad'),
    media: createServiceMedia('srv-7', 6),
    reviews: createServiceReviews('srv-7'),
    _count: { media: 98, reviews: 67 },
    averageRating: 4.9,
  },

  // -------------------- BARRANQUILLA --------------------
  {
    id: 'srv-8',
    name: 'Psicología Bienestar Integral',
    slug: 'psicologia-bienestar-integral',
    description: `Centro de psicología especializado en el bienestar emocional y mental.

**Áreas de atención:**
- Terapia individual y de pareja
- Psicología infantil y adolescente
- Trastornos de ansiedad y depresión
- Coaching personal
- Terapia grupal

Tu bienestar es nuestra prioridad.`,
    logoUrl: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=200',
    coverUrl: 'https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=1200',
    adImageUrl: 'https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=800',
    email: 'citas@psibienestar.com',
    phone: '+57 305 333 4455',
    website: 'https://psibienestar.com',
    address: 'Alto Prado, Carrera 52 #76-150, Barranquilla',
    visibility: ProfessionalServiceVisibility.PUBLIC,
    status: ProfessionalServiceStatus.ACTIVE,
    instagramUrl: 'https://instagram.com/psibienestar',
    linkedinUrl: 'https://linkedin.com/company/psibienestar',
    hourlyRate: 150000,
    currency: 'COP',
    availableForHire: true,
    workType: ['on-site', 'remote'],
    userId: MOCK_SERVICE_OWNERS.owner8.id,
    cityId: 'city-7', // Barranquilla
    categoryId: 'cat-salud',
    tags: ['psicología', 'terapia', 'bienestar', 'salud mental'],
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-12-12T11:00:00Z',
    user: MOCK_SERVICE_OWNERS.owner8,
    city: getServiceCity('city-7'),
    category: cat('cat-salud'),
    media: createServiceMedia('srv-8', 3),
    reviews: createServiceReviews('srv-8'),
    _count: { media: 6, reviews: 45 },
    averageRating: 4.8,
  },

  // -------------------- BUCARAMANGA --------------------
  {
    id: 'srv-9',
    name: 'ElectricoPro Instalaciones',
    slug: 'electricopro-instalaciones',
    description: `Servicios eléctricos profesionales para hogares y empresas.

**Servicios:**
- Instalaciones eléctricas residenciales
- Instalaciones comerciales e industriales
- Mantenimiento preventivo
- Reparaciones de emergencia
- Automatización del hogar

Seguridad y calidad garantizada en cada trabajo.`,
    logoUrl: 'https://images.pexels.com/photos/8961065/pexels-photo-8961065.jpeg?auto=compress&cs=tinysrgb&w=200',
    coverUrl: 'https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=1200',
    adImageUrl: 'https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=800',
    email: 'servicios@electricopro.com',
    phone: '+57 312 999 0011',
    address: 'Cabecera del Llano, Carrera 35 #51-20, Bucaramanga',
    visibility: ProfessionalServiceVisibility.PUBLIC,
    status: ProfessionalServiceStatus.ACTIVE,
    facebookUrl: 'https://facebook.com/electricopro',
    hourlyRate: 60000,
    dailyRate: 350000,
    currency: 'COP',
    availableForHire: true,
    workType: ['on-site'],
    userId: MOCK_SERVICE_OWNERS.owner9.id,
    cityId: 'city-8', // Bucaramanga
    categoryId: 'cat-ingenieria',
    tags: ['electricista', 'instalaciones', 'mantenimiento', 'emergencias'],
    createdAt: '2024-05-10T07:00:00Z',
    updatedAt: '2024-12-01T08:00:00Z',
    user: MOCK_SERVICE_OWNERS.owner9,
    city: getServiceCity('city-8'),
    category: cat('cat-ingenieria'),
    media: createServiceMedia('srv-9', 4),
    reviews: createServiceReviews('srv-9'),
    _count: { media: 15, reviews: 33 },
    averageRating: 4.5,
  },

  // -------------------- CARTAGENA --------------------
  {
    id: 'srv-10',
    name: 'Diseño Creativo Studio',
    slug: 'diseno-creativo-studio',
    description: `Agencia de diseño gráfico y branding para marcas que quieren destacar.

**Servicios:**
- Identidad de marca y branding
- Diseño de logotipos
- Diseño editorial
- Diseño para redes sociales
- Material publicitario

Transformamos ideas en diseños impactantes.`,
    logoUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
    coverUrl: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=1200',
    adImageUrl: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800',
    email: 'hola@disenocreativo.co',
    phone: '+57 316 444 5566',
    website: 'https://disenocreativo.co',
    address: 'Bocagrande, Centro Comercial La Mansión, Local 205, Cartagena',
    visibility: ProfessionalServiceVisibility.PUBLIC,
    status: ProfessionalServiceStatus.ACTIVE,
    instagramUrl: 'https://instagram.com/disenocreativostudio',
    linkedinUrl: 'https://linkedin.com/company/disenocreativo',
    hourlyRate: 100000,
    projectRate: 3000000,
    currency: 'COP',
    availableForHire: true,
    workType: ['remote', 'hybrid'],
    userId: MOCK_SERVICE_OWNERS.owner10.id,
    cityId: 'city-9', // Cartagena
    categoryId: 'cat-diseno-y-creatividad',
    tags: ['diseño', 'branding', 'logotipos', 'gráfico'],
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-12-08T15:00:00Z',
    user: MOCK_SERVICE_OWNERS.owner10,
    city: getServiceCity('city-9'),
    category: cat('cat-diseno-y-creatividad'),
    media: createServiceMedia('srv-10', 5),
    reviews: createServiceReviews('srv-10'),
    _count: { media: 78, reviews: 52 },
    averageRating: 4.75,
  },
]

// ============================================================================
// SERVICIOS BÁSICOS (Para listados)
// ============================================================================

export const MOCK_PROFESSIONAL_SERVICES_BASIC: ProfessionalServiceBasic[] = MOCK_PROFESSIONAL_SERVICES_FULL.map(
  (service) => ({
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    logoUrl: service.logoUrl,
    adImageUrl: service.adImageUrl,
    address: service.address,
    facebookUrl: service.facebookUrl,
    instagramUrl: service.instagramUrl,
    twitterUrl: service.twitterUrl,
    linkedinUrl: service.linkedinUrl,
    youtubeUrl: service.youtubeUrl,
    hourlyRate: service.hourlyRate,
    currency: service.currency,
    availableForHire: service.availableForHire,
    availability: 'Lun-Vie 9am-6pm',
    category: service.category ? {
      id: service.category.id,
      name: service.category.name,
      iconUrl: service.category.iconUrl,
    } : undefined,
    city: {
      id: service.city.id,
      name: service.city.name,
      slug: service.city.slug,
    },
    user: service.user ? {
      id: service.user.id,
      username: service.user.username,
      firstName: service.user.firstName,
      lastName: service.user.lastName,
      avatarUrl: service.user.avatarUrl,
    } : undefined,
    _count: service._count,
    averageRating: service.averageRating,
  })
)

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene un servicio profesional por ID
 */
export function getMockServiceById(id: string): ProfessionalService | undefined {
  return MOCK_PROFESSIONAL_SERVICES_FULL.find((service) => service.id === id)
}

/**
 * Obtiene un servicio profesional por slug
 */
export function getMockServiceBySlug(slug: string): ProfessionalService | undefined {
  return MOCK_PROFESSIONAL_SERVICES_FULL.find((service) => service.slug === slug)
}

/**
 * Obtiene servicios por ciudad
 */
export function getMockServicesByCity(cityId: string): ProfessionalServiceBasic[] {
  return MOCK_PROFESSIONAL_SERVICES_BASIC.filter((service) => service.city?.id === cityId)
}

/**
 * Obtiene servicios por estado/departamento
 */
export function getMockServicesByState(stateId: string): ProfessionalServiceBasic[] {
  const citiesInState = MOCK_CITIES.filter((city) => city.stateId === stateId)
  const cityIds = citiesInState.map((city) => city.id)
  return MOCK_PROFESSIONAL_SERVICES_BASIC.filter((service) => cityIds.includes(service.city?.id ?? ''))
}

/**
 * Obtiene servicios por categoría
 */
export function getMockServicesByCategory(categoryId: string): ProfessionalServiceBasic[] {
  return MOCK_PROFESSIONAL_SERVICES_BASIC.filter((service) => service.category?.id === categoryId)
}

/**
 * Obtiene ciudades por estado
 */
export function getCitiesByState(stateId: string): City[] {
  return MOCK_CITIES.filter((city) => city.stateId === stateId)
}

/**
 * Obtiene todos los estados
 */
export function getAllStates(): State[] {
  return MOCK_STATES
}

/**
 * Obtiene todas las categorías
 */
export function getAllCategories(): ProfessionalServiceCategory[] {
  return SERVICE_CATEGORIES
}
