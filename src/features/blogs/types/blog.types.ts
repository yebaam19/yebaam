export const BLOG_CATEGORIES = [
  'ACCION_SOCIAL_Y_PROTESTA',
  'ADULTOS',
  'AJEDREZ',
  'AMIGOS',
  'ANIME_Y_MANGA',
  'ANTIGUEDADES',
  'ANTROPOLOGIA_Y_ARQUEOLOGIA',
  'ARTES_MARCIALES',
  'AUTOMOVILISMO_Y_MOTOCICLISMO',
  'BARBERIA_Y_PELUQUERIA',
  'CIENCIAS_NATURALES',
  'CIENCIAS_SOCIALES',
  'CINE_Y_TV',
  'COCTELERIA_Y_LICORES',
  'COLECCIONISTAS',
  'COLECCIONISTAS_DE_MUSICA',
  'COMIDA_Y_GASTRONOMIA',
  'CONSTRUCCION',
  'COSMETOLOGIA_Y_BELLEZA',
  'DEBATE',
  'DEPORTES',
  'DISENO_DE_EXTERIORES_E_INTERIORES',
  'ECONOMIA_Y_DESARROLLO',
  'EGRESADOS',
  'EJERCICIO',
  'ESOTERISMO_Y_OCULTISMO',
  'FANS',
  'FILOSOFIA_Y_PENSAMIENTO',
  'FINANZAS_PERSONALES',
  'FLORISTERIA_Y_HORTICULTURA',
  'FOTOGRAFIA',
  'GENTE_Y_CULTURA',
  'HISTORIA_Y_ARTE',
  'HUMOR_Y_COMEDIA',
  'IDIOMAS_Y_LENGUAJES',
  'JABONERIA_Y_PERFUMERIA',
  'JARDINERIA',
  'JOYERIA_Y_ORFEBRERIA',
  'JUEGOS',
  'LECTURA',
  'LITERATURA_Y_POESIA',
  'MARROQUINERIA_Y_CUEROS',
  'MASCOTAS_Y_CUIDADO_DE_ANIMALES',
  'MEDIO_AMBIENTE',
  'MODA',
  'MODISTERIA_Y_COSTURA',
  'MUSICA_ENSENANZA',
  'MUSICA_GENEROS',
  'MUSICA_INDUSTRIA',
  'NEGOCIOS_Y_EMPRENDIMIENTOS',
  'NOTICIAS_Y_OPINION',
  'NUMISMATICA_Y_FILATELIA',
  'PANADERIA_Y_PASTELERIA',
  'PARANORMAL',
  'PASATIEMPOS',
  'POLITICA_Y_SOCIEDAD',
  'PSICOLOGIA_Y_TERAPIA',
  'RELIGION_Y_ESPIRITUALIDAD',
  'REPORTAJES_PERIODISTICOS',
  'SEXUALIDAD_Y_GENERO',
  'TALENTOS',
  'VIAJES_Y_EVENTOS',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogPrivacy = 'PUBLIC' | 'PRIVATE';

export interface BlogAuthor {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  isVerified?: boolean;
}

/** A badge granted to a blog, drawn from the shared `badges` catalog. */
export interface BlogBadge {
  slug: string;
  name: string;
  category: string;
  iconCfImageId?: string | null;
}

/** PDF circle #2: artist distinction level (admin-set). */
export type BlogDistinction = 'local' | 'national' | 'international';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImage?: string;
  author: BlogAuthor;
  publishedAt: Date;
  readTime: number; // minutos
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  isLiked?: boolean;
}

export interface BlogStats {
  postsCount: number;
  followersCount: number;
  totalViews: number;
  totalLikes: number;
  /** Blog-level "me gusta" count (blog_reactions kind='like'). */
  likesCount?: number;
  /** Blog-level recommendation count (blog_reactions kind='recommend'). */
  recommendCount?: number;
  averageReadTime?: number;
  publishFrequency?: string; // "Semanal", "Mensual", etc.
}

export interface Blog {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: BlogCategory;
  subcategory?: string;
  
  // Media
  profileImageUrl?: string;
  coverImageUrl?: string;
  
  // Stats
  stats: BlogStats;
  
  // Authors (backend usa owner y authors)
  owner: BlogAuthor;
  authors: BlogAuthor[];
  mainAuthor?: BlogAuthor; // Deprecado, usar owner
  
  // User relationship
  isFollowing: boolean;
  isOwner?: boolean;
  isAuthor?: boolean;
  /** Whether the current viewer has liked / recommended this blog. */
  viewerLiked?: boolean;
  viewerRecommended?: boolean;
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  
  // Verification
  isVerified: boolean;
  /** Circle #2: artist distinction level (admin-set), or null. */
  distinction?: BlogDistinction | null;
  /** Franja de badges: admin-granted achievements. */
  badges?: BlogBadge[];
  /** "Mi Música" link to a catalog artist (PDF #10). */
  musicArtistId?: string | null;
  musicArtist?: { id: string; name: string } | null;
  
  // Additional info
  website?: string;
  social?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  tags: string[];
  
  // Recent posts preview
  recentPosts?: BlogPost[];
}

export interface CreateBlogDto {
  name: string;
  description: string;
  category: BlogCategory;
  subcategory?: string;
  profileImage?: File;
  coverImage?: File;
  website?: string;
  social?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  tags?: string[];
}

export interface UpdateBlogDto {
  name?: string;
  description?: string;
  category?: BlogCategory;
  subcategory?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  website?: string;
  social?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  tags?: string[];
}

export interface SearchBlogsParams {
  query?: string;
  category?: BlogCategory;
  tags?: string[];
  verified?: boolean;
  minFollowers?: number;
  sortBy?: 'name' | 'followers' | 'posts' | 'views' | 'created';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateBlogPostDto {
  blogId: string;
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: File;
  tags?: string[];
  publishNow?: boolean;
}

export interface UpdateBlogPostDto {
  title?: string;
  content?: string;
  excerpt?: string;
  coverImageUrl?: string;
  tags?: string[];
}

// API Response types
export interface BlogResponse {
  blog: Blog;
  isFollowing: boolean;
  isOwner: boolean;
}

export interface BlogsListResponse {
  blogs: Blog[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
