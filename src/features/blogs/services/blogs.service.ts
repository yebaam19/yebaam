import { getAxiosInstance } from '@/lib/legacy-api/client';
import type { Blog, SearchBlogsParams, BlogsListResponse, BlogPost } from '../types/blog.types';
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';

const API_BASE = '/api/blogs';

/**
 * BlogsService
 * 
 * Servicio para gestionar blogs conectado con el backend real
 */
class BlogsService {
  /**
   * Obtener mis blogs (blogs que creo/administro)
   */
  async getMyBlogs(): Promise<Blog[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/my`);
    return data;
  }

  /**
   * Obtener blogs que sigo
   */
  async getFollowedBlogs(): Promise<Blog[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/followed`);
    return data;
  }

  /**
   * Obtener blogs sugeridos
   */
  async getSuggestedBlogs(limit: number = 10): Promise<Blog[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/suggested`, {
      params: { limit },
    });
    return data;
  }

  /**
   * Obtener blogs populares
   */
  async getPopularBlogs(limit: number = 10): Promise<Blog[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/popular`, {
      params: { limit },
    });

    return data;
  }

  /**
   * Buscar blogs
   */
  async searchBlogs(params: SearchBlogsParams): Promise<BlogsListResponse> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/search`, { params });
    return data;
  }

  /**
   * Obtener blog por ID
   */
  async getBlogById(blogId: string): Promise<Blog> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/${blogId}`);
    return data;
  }

  /**
   * Obtener blog por slug
   */
  async getBlogBySlug(slug: string): Promise<Blog> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/${slug}`);
    console.log('getBlogBySlug response:', { slug, data });
    return data;
  }

  /**
   * Seguir un blog
   */
  async followBlog(blogId: string): Promise<void> {

    const axios = getAxiosInstance();
    try {
      const response = await axios.post(`${API_BASE}/${blogId}/follow`);

    } catch (error: any) {

      throw error;
    }
  }

  /**
   * Dejar de seguir un blog
   */
  async unfollowBlog(blogId: string): Promise<void> {

    const axios = getAxiosInstance();
    try {
      const response = await axios.delete(`${API_BASE}/${blogId}/unfollow`);
      console.log('[BlogsService] unfollowBlog - Success:', response.data);
    } catch (error: any) {
      
      throw error;
    }
  }

  /**
   * Obtener blogs trending (más vistas) - Por ahora usa populares
   */
  async getTrendingBlogs(limit: number = 10): Promise<Blog[]> {
    // Por ahora usamos popular, en el futuro se puede crear otro endpoint
    return this.getPopularBlogs(limit);
  }

  /**
   * Obtener blogs por categoría
   */
  async getBlogsByCategory(category: string, limit: number = 12): Promise<Blog[]> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(`${API_BASE}/search`, {
      params: { category, limit },
    });
    return data.blogs || data;
  }

  /**
   * Obtener posts de un blog
   */
  /**
   * Obtener posts de un blog
   */
  async getBlogPosts(blogId: string, page: number = 1, limit: number = 10): Promise<Post[]> {
    const axios = await getAxiosInstance();
    const response = await axios.get(`/api/blogs/${blogId}/posts`, {
      params: { page, limit },
    });
    return response.data.data;
  }

  /**
   * Obtener post por slug (TODO: implementar cuando haya endpoint)
   */
  async getPostBySlug(blogSlug: string, postSlug: string): Promise<BlogPost> {
    // TODO: Implementar cuando el backend tenga este endpoint
    throw new Error('getPostBySlug: Endpoint no implementado aún');
  }

  /**
   * Crear un nuevo blog
   */
  async createBlog(blogData: {
    name: string;
    description: string;
    category: string;
    subcategory?: string;
    profileImageUrl?: string;
    coverImageUrl?: string;
    website?: string;
    social?: {
      twitter?: string;
      instagram?: string;
      youtube?: string;
      facebook?: string;
      linkedin?: string;
      tiktok?: string;
    };
    tags?: string[];
  }): Promise<Blog> {
    const axios = getAxiosInstance();
    const { data } = await axios.post(API_BASE, blogData);
    console.log('🆕 Blog creado - respuesta del backend:', {
      id: data.id,
      name: data.name,
      slug: data.slug,
      stats: data.stats,
      owner: data.owner,
      isOwner: data.isOwner,
    });
    return data;
  }

  /**
   * Actualizar un blog
   */
  async updateBlog(blogId: string, blogData: {
    name?: string;
    description?: string;
    category?: string;
    subcategory?: string;
    profileImageUrl?: string;
    coverImageUrl?: string;
    website?: string;
    social?: {
      twitter?: string;
      instagram?: string;
      youtube?: string;
      facebook?: string;
      linkedin?: string;
      tiktok?: string;
    };
    tags?: string[];
  }): Promise<Blog> {
    const axios = getAxiosInstance();
    const { data } = await axios.put(`${API_BASE}/${blogId}`, blogData);
    console.log('📝 Blog actualizado - respuesta del backend:', {
      id: data.id,
      name: data.name,
      slug: data.slug,
    });
    return data;
  }

  /**
   * Generar URL para subir imagen de perfil
   */
  async generateProfileImageUrl(fileName: string, fileType: string, fileSize: number): Promise<{ uploadUrl: string; cloudFrontUrl: string; s3Key: string }> {
    const axios = getAxiosInstance();
    const { data } = await axios.post(`${API_BASE}/generate-profile-image-url`, {
      fileName,
      fileType,
      fileSize,
    });
    return data;
  }

  /**
   * Generar URL para subir imagen de portada
   */
  async generateCoverImageUrl(fileName: string, fileType: string, fileSize: number): Promise<{ uploadUrl: string; cloudFrontUrl: string; s3Key: string }> {
    const axios = getAxiosInstance();
    const { data } = await axios.post(`${API_BASE}/generate-cover-image-url`, {
      fileName,
      fileType,
      fileSize,
    });
    return data;
  }

  /**
   * Subir imagen a S3 usando presigned URL
   */
  async uploadImageToS3(uploadUrl: string, file: File): Promise<void> {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  }
}

export const blogsService = new BlogsService();
