/**
 * Professional services category taxonomy — single source of truth.
 *
 * Transcribed from the product spec (public/SERVICIOS-PROFESIONALES.pdf):
 * the professional picks a parent **category** and then one or more
 * **subcategories**. Names are kept verbatim (Spanish, with accents) for
 * display; IDs are derived by slugifying + stripping accents so they are
 * stable and URL-safe. Subcategory IDs are namespaced under their parent
 * (`<categoryId>__<subSlug>`) because the same subcategory name can appear
 * under more than one parent (e.g. "Coaching ejecutivo", "Investigación de
 * mercados") and we need globally-unique IDs.
 */

import type {
  ProfessionalServiceCategory,
  ProfessionalServiceSubcategory,
} from '../interfaces/professional-service.interfaces'

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics (á → a, ñ → n)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface RawCategory {
  name: string
  description: string
  subcategories: string[]
}

const RAW_TAXONOMY: RawCategory[] = [
  {
    name: 'Administración y Negocios',
    description: 'Consultoría, estrategia y gestión empresarial',
    subcategories: [
      'Consultoría empresarial',
      'Planificación estratégica',
      'Gestión de proyectos',
      'Auditoría interna',
      'Control de calidad',
      'Gestión de riesgos',
      'Investigación de mercados',
      'Desarrollo de negocios',
      'Franquicias y licencias',
      'Gestión de operaciones',
      'Compras y abastecimiento',
      'Logística y cadena de suministro',
    ],
  },
  {
    name: 'Finanzas y Contabilidad',
    description: 'Contabilidad, impuestos y asesoría financiera',
    subcategories: [
      'Contabilidad general',
      'Contabilidad fiscal',
      'Auditoría financiera',
      'Asesoría tributaria',
      'Planeación financiera',
      'Gestión de inversiones',
      'Análisis financiero',
      'Valoración de empresas',
      'Gestión de tesorería',
      'Elaboración de presupuestos',
      'Nómina',
      'Consultoría financiera',
    ],
  },
  {
    name: 'Servicios Legales',
    description: 'Derecho, contratos y litigios',
    subcategories: [
      'Derecho corporativo',
      'Derecho laboral',
      'Derecho fiscal',
      'Derecho civil',
      'Derecho mercantil',
      'Derecho inmobiliario',
      'Propiedad intelectual',
      'Mediación y arbitraje',
      'Cumplimiento normativo',
      'Protección de datos',
      'Contratos y acuerdos',
      'Litigios',
    ],
  },
  {
    name: 'Recursos Humanos',
    description: 'Reclutamiento, talento y desarrollo organizacional',
    subcategories: [
      'Reclutamiento y selección',
      'Headhunting',
      'Capacitación empresarial',
      'Desarrollo organizacional',
      'Evaluación de desempeño',
      'Gestión del talento',
      'Compensaciones y beneficios',
      'Coaching ejecutivo',
      'Outplacement',
      'Clima laboral',
    ],
  },
  {
    name: 'Tecnología e Informática',
    description: 'Desarrollo de software, datos e infraestructura',
    subcategories: [
      'Desarrollo de software',
      'Desarrollo web',
      'Desarrollo de aplicaciones móviles',
      'Administración de sistemas',
      'Soporte técnico',
      'Ciberseguridad',
      'Computación en la nube',
      'Inteligencia artificial',
      'Ciencia de datos',
      'Análisis de datos',
      'Automatización de procesos',
      'DevOps',
      'Administración de bases de datos',
      'Arquitectura de software',
      'Consultoría tecnológica',
    ],
  },
  {
    name: 'Marketing y Ventas',
    description: 'Marketing digital, publicidad y ventas',
    subcategories: [
      'Marketing digital',
      'SEO',
      'SEM',
      'Gestión de redes sociales',
      'Publicidad online',
      'Branding',
      'Diseño de campañas',
      'Email marketing',
      'Marketing de contenidos',
      'Relaciones públicas',
      'Investigación de mercados',
      'Gestión comercial',
      'Ventas B2B',
      'Ventas B2C',
    ],
  },
  {
    name: 'Diseño y Creatividad',
    description: 'Diseño gráfico, audiovisual y de producto',
    subcategories: [
      'Diseño gráfico',
      'Diseño web',
      'Diseño UX/UI',
      'Diseño industrial',
      'Diseño de interiores',
      'Diseño de producto',
      'Ilustración',
      'Animación',
      'Producción audiovisual',
      'Fotografía profesional',
      'Edición de video',
      'Dirección de arte',
    ],
  },
  {
    name: 'Ingeniería',
    description: 'Ingeniería civil, mecánica, eléctrica e industrial',
    subcategories: [
      'Ingeniería civil',
      'Ingeniería mecánica',
      'Ingeniería eléctrica',
      'Ingeniería electrónica',
      'Ingeniería industrial',
      'Ingeniería química',
      'Ingeniería ambiental',
      'Ingeniería de procesos',
      'Supervisión de obras',
      'Cálculo estructural',
      'Gestión de proyectos de ingeniería',
    ],
  },
  {
    name: 'Arquitectura y Construcción',
    description: 'Diseño arquitectónico, urbanismo y obra',
    subcategories: [
      'Arquitectura',
      'Urbanismo',
      'Diseño arquitectónico',
      'Remodelación',
      'Dirección de obra',
      'Topografía',
      'Inspección técnica',
      'Tasación inmobiliaria',
      'Gestión de permisos',
    ],
  },
  {
    name: 'Salud',
    description: 'Medicina, psicología y terapias',
    subcategories: [
      'Medicina general',
      'Especialidades médicas',
      'Psicología',
      'Psiquiatría',
      'Nutrición',
      'Fisioterapia',
      'Terapia ocupacional',
      'Logopedia',
      'Enfermería',
      'Salud ocupacional',
    ],
  },
  {
    name: 'Educación y Formación',
    description: 'Docencia, tutorías y capacitación',
    subcategories: [
      'Docencia',
      'Tutorías',
      'Capacitación corporativa',
      'Formación online',
      'Diseño instruccional',
      'Coaching académico',
      'Orientación vocacional',
      'Cursos de idiomas',
    ],
  },
  {
    name: 'Comunicación y Lenguaje',
    description: 'Traducción, redacción y contenidos',
    subcategories: [
      'Traducción e Interpretación',
      'Corrección de estilo y Redacción técnica',
      'Redacción publicitaria',
      'Copywriting',
      'Edición de textos',
      'Creación de contenidos',
    ],
  },
  {
    name: 'Bienes Raíces',
    description: 'Corretaje, administración y consultoría inmobiliaria',
    subcategories: [
      'Corretaje inmobiliario',
      'Administración de propiedades',
      'Tasaciones',
      'Consultoría inmobiliaria',
      'Gestión de alquileres',
      'Inversión inmobiliaria',
    ],
  },
  {
    name: 'Medio Ambiente y Sostenibilidad',
    description: 'Consultoría ambiental y energías renovables',
    subcategories: [
      'Consultoría ambiental',
      'Estudios de impacto ambiental',
      'Gestión de residuos',
      'Energías renovables',
      'Sostenibilidad corporativa',
      'Auditorías ambientales',
    ],
  },
  {
    name: 'Comercio Internacional',
    description: 'Importación, exportación y comercio exterior',
    subcategories: [
      'Importación y exportación',
      'Despacho aduanero',
      'Comercio exterior',
      'Logística internacional',
      'Certificaciones internacionales',
    ],
  },
  {
    name: 'Seguridad',
    description: 'Seguridad física, informática e industrial',
    subcategories: [
      'Consultoría de seguridad',
      'Seguridad informática',
      'Seguridad industrial',
      'Prevención de riesgos laborales',
      'Investigación privada',
    ],
  },
  {
    name: 'Eventos',
    description: 'Organización y producción de eventos',
    subcategories: [
      'Organización de eventos',
      'Producción de eventos',
      'Protocolo empresarial',
      'Gestión de congresos',
      'Wedding planner',
    ],
  },
  {
    name: 'Servicios Especializados',
    description: 'Coaching, mentoría, peritajes y certificaciones',
    subcategories: [
      'Coaching personal',
      'Coaching ejecutivo',
      'Mentoría profesional',
      'Consultoría de imagen',
      'Gestión documental',
      'Investigación científica',
      'Peritajes',
      'Certificaciones',
      'Normalización y calidad',
    ],
  },
  {
    name: 'Servicios Profesionales Emergentes',
    description: 'IA, transformación digital y nuevas tecnologías',
    subcategories: [
      'Consultoría en IA',
      'Prompt engineering',
      'Automatización con IA',
      'Analítica avanzada',
      'Transformación digital',
      'Gestión de comunidades digitales',
      'Creación de cursos online',
      'Consultoría en ciberseguridad',
      'Gestión de activos digitales',
      'Desarrollo de chatbots',
    ],
  },
  {
    name: 'Sociología',
    description: 'Investigación social y políticas públicas',
    subcategories: [
      'Investigación social',
      'Encuestas y estudios de opinión',
      'Análisis de datos sociales',
      'Evaluación de programas y políticas públicas',
      'Diagnóstico comunitario',
      'Estudios de mercado y comportamiento social',
      'Consultoría en desarrollo social',
      'Estudios de género, juventud y migración',
    ],
  },
  {
    name: 'Antropología',
    description: 'Etnografía, estudios culturales y patrimonio',
    subcategories: [
      'Etnografía y trabajo de campo',
      'Estudios culturales e interculturales',
      'Investigación sobre comunidades e identidades',
      'Consultoría intercultural',
      'Estudios de impacto sociocultural',
      'Gestión del patrimonio cultural',
      'Antropología aplicada a salud, educación y desarrollo',
      'Investigación cualitativa',
    ],
  },
  {
    name: 'Historia',
    description: 'Investigación histórica, archivos y patrimonio',
    subcategories: [
      'Investigación histórica',
      'Gestión de archivos y documentos',
      'Historia oral',
      'Genealogía',
      'Conservación y difusión del patrimonio histórico',
      'Curaduría de museos y exposiciones',
      'Asesoría histórica para publicaciones y medios',
      'Divulgación y educación histórica',
    ],
  },
]

/** A category with its subcategories materialised (taxonomy node). */
export interface TaxonomyCategory extends ProfessionalServiceCategory {
  slug: string
  subcategories: ProfessionalServiceSubcategory[]
}

export const SERVICE_CATEGORY_TAXONOMY: TaxonomyCategory[] = RAW_TAXONOMY.map((cat) => {
  const slug = slugify(cat.name)
  const id = `cat-${slug}`
  return {
    id,
    name: cat.name,
    slug,
    description: cat.description,
    createdAt: '2024-01-01T00:00:00Z',
    subcategories: cat.subcategories.map((sub) => {
      const subSlug = slugify(sub)
      return {
        id: `${id}__${subSlug}`,
        name: sub,
        slug: subSlug,
        parentId: id,
      }
    }),
  }
})

/**
 * Flat list of parent categories (shape `ProfessionalServiceCategory[]`).
 * This is what the mock backend / category dropdowns consume; each entry
 * still carries its `subcategories` for the create flow.
 */
export const SERVICE_CATEGORIES: ProfessionalServiceCategory[] = SERVICE_CATEGORY_TAXONOMY

export function findCategoryById(id: string): TaxonomyCategory | undefined {
  return SERVICE_CATEGORY_TAXONOMY.find((c) => c.id === id)
}

export function getSubcategoriesForCategory(categoryId: string): ProfessionalServiceSubcategory[] {
  return findCategoryById(categoryId)?.subcategories ?? []
}

export function findSubcategoryById(id: string): ProfessionalServiceSubcategory | undefined {
  for (const cat of SERVICE_CATEGORY_TAXONOMY) {
    const match = cat.subcategories.find((s) => s.id === id)
    if (match) return match
  }
  return undefined
}
