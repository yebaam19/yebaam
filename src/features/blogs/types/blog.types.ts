export type BlogCategory = 
  | 'TECNOLOGIA'
  | 'NEGOCIOS'
  | 'LIFESTYLE'
  | 'VIAJES'
  | 'GASTRONOMIA'
  | 'MODA'
  | 'DEPORTES'
  | 'SALUD'
  | 'CIENCIA'
  | 'ARTE'
  | 'MUSICA'
  | 'CINE'
  | 'LIBROS'
  | 'EDUCACION'
  | 'FINANZAS'
  | 'MARKETING'
  | 'DISEÑO'
  | 'FOTOGRAFIA'
  | 'DESARROLLO_PERSONAL'
  | 'OTRO';

export type BlogPrivacy = 'PUBLIC' | 'PRIVATE';

export interface BlogAuthor {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  isVerified?: boolean;
}

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
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  
  // Verification
  isVerified: boolean;
  
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
