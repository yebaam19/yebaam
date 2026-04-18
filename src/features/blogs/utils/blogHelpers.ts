import type { BlogCategory } from '../types/blog.types';

export const BLOG_CATEGORY_LABELS: Record<BlogCategory, string> = {
  ACCION_SOCIAL_Y_PROTESTA: 'Acción Social y Protesta',
  ADULTOS: 'Adultos',
  AJEDREZ: 'Ajedrez',
  AMIGOS: 'Amigos',
  ANIME_Y_MANGA: 'Anime y Manga',
  ANTIGUEDADES: 'Antigüedades',
  ANTROPOLOGIA_Y_ARQUEOLOGIA: 'Antropología y Arqueología',
  ARTES_MARCIALES: 'Artes Marciales',
  AUTOMOVILISMO_Y_MOTOCICLISMO: 'Automovilismo y Motociclismo',
  BARBERIA_Y_PELUQUERIA: 'Barbería y Peluquería',
  CIENCIAS_NATURALES: 'Ciencias Naturales',
  CIENCIAS_SOCIALES: 'Ciencias Sociales',
  CINE_Y_TV: 'Cine y TV',
  COCTELERIA_Y_LICORES: 'Coctelería y Licores',
  COLECCIONISTAS: 'Coleccionistas',
  COLECCIONISTAS_DE_MUSICA: 'Coleccionistas de Música',
  COMIDA_Y_GASTRONOMIA: 'Comida y Gastronomía',
  CONSTRUCCION: 'Construcción',
  COSMETOLOGIA_Y_BELLEZA: 'Cosmetología y Belleza',
  DEBATE: 'Debate',
  DEPORTES: 'Deportes',
  DISENO_DE_EXTERIORES_E_INTERIORES: 'Diseño de Exteriores e Interiores',
  ECONOMIA_Y_DESARROLLO: 'Economía y Desarrollo',
  EGRESADOS: 'Egresados',
  EJERCICIO: 'Ejercicio',
  ESOTERISMO_Y_OCULTISMO: 'Esoterismo y Ocultismo',
  FANS: 'Fans',
  FILOSOFIA_Y_PENSAMIENTO: 'Filosofía y Pensamiento',
  FINANZAS_PERSONALES: 'Finanzas Personales',
  FLORISTERIA_Y_HORTICULTURA: 'Floristería y Horticultura',
  FOTOGRAFIA: 'Fotografía',
  GENTE_Y_CULTURA: 'Gente y Cultura',
  HISTORIA_Y_ARTE: 'Historia y Arte',
  HUMOR_Y_COMEDIA: 'Humor y Comedia',
  IDIOMAS_Y_LENGUAJES: 'Idiomas y Lenguajes',
  JABONERIA_Y_PERFUMERIA: 'Jabonería y Perfumería',
  JARDINERIA: 'Jardinería',
  JOYERIA_Y_ORFEBRERIA: 'Joyería y Orfebrería',
  JUEGOS: 'Juegos',
  LECTURA: 'Lectura',
  LITERATURA_Y_POESIA: 'Literatura y Poesía',
  MARROQUINERIA_Y_CUEROS: 'Marroquinería y Cueros',
  MASCOTAS_Y_CUIDADO_DE_ANIMALES: 'Mascotas y Cuidado de Animales',
  MEDIO_AMBIENTE: 'Medio Ambiente',
  MODA: 'Moda',
  MODISTERIA_Y_COSTURA: 'Modistería y Costura',
  MUSICA_ENSENANZA: 'Música (Enseñanza)',
  MUSICA_GENEROS: 'Música (Géneros)',
  MUSICA_INDUSTRIA: 'Música (Industria)',
  NEGOCIOS_Y_EMPRENDIMIENTOS: 'Negocios y Emprendimientos',
  NOTICIAS_Y_OPINION: 'Noticias y Opinión',
  NUMISMATICA_Y_FILATELIA: 'Numismática y Filatelia',
  PANADERIA_Y_PASTELERIA: 'Panadería y Pastelería',
  PARANORMAL: 'Paranormal',
  PASATIEMPOS: 'Pasatiempos',
  POLITICA_Y_SOCIEDAD: 'Política y Sociedad',
  PSICOLOGIA_Y_TERAPIA: 'Psicología y Terapia',
  RELIGION_Y_ESPIRITUALIDAD: 'Religión y Espiritualidad',
  REPORTAJES_PERIODISTICOS: 'Reportajes Periodísticos',
  SEXUALIDAD_Y_GENERO: 'Sexualidad y Género',
  TALENTOS: 'Talentos',
  VIAJES_Y_EVENTOS: 'Viajes y Eventos',
};

export function getCategoryLabel(category: BlogCategory | string): string {
  return BLOG_CATEGORY_LABELS[category as BlogCategory] || category;
}

const CATEGORY_COLOR_PALETTE = [
  'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
  'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
  'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300',
  'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',
  'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
  'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300',
];

export function getCategoryColor(category: BlogCategory | string): string {
  if (!category) return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) | 0;
  return CATEGORY_COLOR_PALETTE[Math.abs(hash) % CATEGORY_COLOR_PALETTE.length];
}

export function formatFollowersCount(count: number | undefined): string {
  if (!count) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function formatViewsCount(count: number | undefined): string {
  if (!count) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function formatReadTime(minutes: number): string {
  return `${minutes} min de lectura`;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
