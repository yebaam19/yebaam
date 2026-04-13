

import { getAxiosInstance } from '@/lib/legacy-api/client';
import { CreateCommentDTO, CreatePostDTO, GetPostsFilters, Post, ReactionType, UpdatePostDTO } from '../interfaces/post.interfaces';
import { PostStatisticsResponse } from '../interfaces/statistics.interfaces';

const POST_ENDPOINTS:any = {
  CREATE_POST: '/api/create-post',  // Endpoint para crear posts
  POSTS: '/api/posts/timeline',  // Endpoint de timeline (excluye posts de blogs/páginas)
  POST_BY_ID: (id: string) => `/api/my-post/${id}`,      
  UPDATE_POST: (id: string) => `/api/post/${id}`,      
  DELETE_POST: (id: string) => `/api/post/delete-post/${id}`, 
  MY_POSTS: '/api/my-post',
  USER_POSTS: (userId: string) => `/api/post/user/${userId}`,
  STATISTICS: (id: string) => `/api/posts/${id}/statistics`, 
} as const;

/**
 * Endpoints del API de reacciones
 */
const REACTION_ENDPOINTS = {
  CREATE: '/api/reactions',
  UPDATE: (postId: string) => `/api/reactions/${postId}`,
  DELETE: (postId: string) => `/api/reactions/${postId}`,
  BY_POST: (postId: string) => `/api/reactions/post/${postId}`,
  MY_REACTION: (postId: string) => `/api/reactions/post/${postId}/my-reaction`,
  COUNTS: (postId: string) => `/api/reactions/post/${postId}/counts`,
} as const;

/**
 * Endpoints del API de comentarios (placeholder)
 */
const COMMENT_ENDPOINTS = {
  COMMENTS: (postId: string) => `/api/posts/${postId}/comments`,
} as const;

/**
 * Interfaces para presigned URLs
 */
export interface PresignedUrlData {
  uploadUrl: string;
  cloudFrontUrl: string;
  s3Key: string;
  expiresIn?: number;
}

export interface GenerateUploadUrlsRequest {
  files: {
    fileName: string;
    fileType: string;
    fileSize: number;
  }[];
}

export interface GenerateUploadUrlsResponse {
  urls: PresignedUrlData[];
}

export class PostService {
  private readonly axios = getAxiosInstance();

  private transformBackendPost(backendPost: any): Post {

    
    const transformed = {
      id: backendPost._id || backendPost.id,
      content: backendPost.content,
      backgroundColor: backendPost.backgroundColor,
      mediaFiles: (backendPost.mediaFiles || []).map((media: any) => {
        const transformedMedia = {
          id: media.id || media._id,
          url: media.url,
          type: media.type?.toUpperCase() as 'IMAGE' | 'VIDEO',
          thumbnailUrl: media.thumbnailUrl,
          s3Key: media.s3Key,
          size: media.size,
          duration: media.duration,
          mimeType: media.mimeType,
        };
        console.log('  Transformed media file:', {
          original: media,
          transformed: transformedMedia
        });
        return transformedMedia;
      }),
      privacy: typeof backendPost.privacy === 'string' 
        ? { value: backendPost.privacy } 
        : backendPost.privacy,
      author: {
        id: backendPost.authorId || backendPost.author?.id,
        username: backendPost.authorUsername || backendPost.author?.username,
        firstName: backendPost.authorFirstName || backendPost.author?.firstName,
        lastName: backendPost.authorLastName || backendPost.author?.lastName,
        avatar: backendPost.authorAvatar || backendPost.author?.avatar,
        _id: backendPost.authorId || backendPost.author?.id,
      },
      reactionsCount: backendPost.reactionsCount || {
        like: 0,
        love: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      },
      commentsCount: backendPost.commentsCount || 0,
      sharesCount: backendPost.sharesCount || 0,
      currentUserReaction: backendPost.myReaction,
      createdAt: backendPost.createdAt,
      updatedAt: backendPost.updatedAt,
      // Campos opcionales
      feeling: backendPost.feeling,
      location: backendPost.location,
      taggedUsers: backendPost.taggedUsers,
      gif: backendPost.gif,
      // Campos de reels
      isReel: backendPost.isReel,
      aspectRatio: backendPost.aspectRatio,
    };
    
 
    
    return transformed;
  }

  /**
   * Crea un nuevo post
   * 
   * @param data - Datos del post a crear
   * @returns Post creado
   */
  async create(data: CreatePostDTO): Promise<Post> {
    try {
      console.log('Creating post with data:', data);
      
      // Sanitizar el objeto para evitar referencias circulares
      const sanitizedData = JSON.parse(JSON.stringify(data));
      

      const response = await this.axios.post(POST_ENDPOINTS.CREATE_POST, sanitizedData);
      const postData = response.data.data || response.data;
      
      return this.transformBackendPost(postData);
    } catch (error) {
      console.error(' Error creating post:', error);
      throw this.handleError(error, 'Error al crear post');
    }
  }

  /**
   * Obtiene un post por ID
   * 
   * @param postId - ID del post
   * @returns Post encontrado
   */
  async getById(postId: string): Promise<Post> {
    try {
  
      const response = await this.axios.get(POST_ENDPOINTS.POST_BY_ID(postId));
      const postData = response.data.data || response.data;
      const transformedPost = this.transformBackendPost(postData);
      return transformedPost;
    } catch (error) {
      console.error(' getById - Error:', error);
      throw this.handleError(error, 'Error al obtener post');
    }
  }

  /**
   * Obtiene todos los posts (timeline)
   * 
   * @param filters - Filtros de paginación
   * @returns Lista de posts
   */
  async getAll(filters?: GetPostsFilters): Promise<Post[]> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await this.axios.get(POST_ENDPOINTS.POSTS, { params });
      
      // El backend puede devolver el array directamente o envuelto en { message, data }
      const posts = response.data.data || response.data;
      
      return Array.isArray(posts) 
        ? posts.map(post => this.transformBackendPost(post))
        : [];
    } catch (error) {
      throw this.handleError(error, 'Error al obtener posts');
    }
  }

  /**
   * Obtiene posts públicos (sin autenticación requerida)
   * 
   * @param filters - Filtros de paginación
   * @returns Respuesta con posts y metadata
   */
  async getPublicPosts(filters?: GetPostsFilters): Promise<{ posts: Post[]; total: number; page: number; totalPages: number }> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await this.axios.get('/posts/public', { params });
      
      // El backend puede devolver { posts, total, page, totalPages } o un array simple
      if (response.data.posts) {
        return {
          posts: response.data.posts.map((post: any) => this.transformBackendPost(post)),
          total: response.data.total || response.data.posts.length,
          page: response.data.page || 1,
          totalPages: response.data.totalPages || 1,
        };
      }
      
      // Si devuelve un array simple
      const posts = Array.isArray(response.data) 
        ? response.data.map(post => this.transformBackendPost(post))
        : [];
      
      return {
        posts,
        total: posts.length,
        page: 1,
        totalPages: 1,
      };
    } catch (error) {
      throw this.handleError(error, 'Error al obtener posts públicos');
    }
  }

  /**
   * Obtiene los posts del usuario autenticado
   * 
   * @param filters - Filtros de paginación
   * @returns Lista de posts del usuario
   */
  async getMyPosts(filters?: GetPostsFilters): Promise<Post[]> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await this.axios.get(POST_ENDPOINTS.MY_POSTS, { params });

      

      const postsData = response.data.data || response.data;

      
      const transformedPosts = Array.isArray(postsData)
        ? postsData.map(post => this.transformBackendPost(post))
        : [];
      

      return transformedPosts;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener tus posts');
    }
  }

  /**
   * Obtiene los posts de un usuario específico
   * 
   * @param userId - ID del usuario
   * @param filters - Filtros de paginación
   * @returns Lista de posts del usuario
   */
  async getUserPosts(userId: string, filters?: GetPostsFilters): Promise<Post[]> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await this.axios.get(POST_ENDPOINTS.USER_POSTS(userId), { params });
      return Array.isArray(response.data)
        ? response.data.map(post => this.transformBackendPost(post))
        : [];
    } catch (error) {
      throw this.handleError(error, 'Error al obtener posts del usuario');
    }
  }

  /**
   * Obtiene los posts de una página específica
   * 
   * @param pageId - ID de la página
   * @param limit - Número de posts a devolver
   * @returns Lista de posts de la página
   */
  async getPagePosts(pageId: string, limit: number = 20): Promise<Post[]> {
    try {
      console.log(' Obteniendo posts de página:', { pageId, limit });
      const response = await this.axios.get(`/api/pages/${pageId}/posts`, {
        params: { limit }
      });
      
      console.log(' Posts recibidos:', response.data?.length || 0);
      
      const postsData = response.data.data || response.data;
      const transformedPosts = Array.isArray(postsData)
        ? postsData.map(post => this.transformBackendPost(post))
        : [];
      
      console.log(' Posts transformados:', transformedPosts.length);
      return transformedPosts;
    } catch (error) {
      console.error(' Error al obtener posts de página:', error);
      throw this.handleError(error, 'Error al obtener posts de la página');
    }
  }

  /**
   * Actualiza un post
   * 
   * @param postId - ID del post a actualizar
   * @param data - Datos a actualizar
   * @returns Post actualizado
   */
  async update(postId: string, data: UpdatePostDTO): Promise<Post> {
    try {
      // Construir el payload con todos los campos opcionales
      const postData: any = {
        content: data.content,
        backgroundColor: data.backgroundColor,
      };

      // El backend espera privacy como string simple ('public', 'private', 'friends')
      if (data.privacy) {
        postData.privacy = data.privacy;
      }

      // Agregar mediaFiles si existen
      if (data.mediaFiles && data.mediaFiles.length > 0) {
        postData.mediaFiles = data.mediaFiles;
      }

      // Agregar otros campos opcionales si existen
      if (data.feeling) {
        postData.feeling = data.feeling;
      }

      if (data.location) {
        postData.location = data.location;
      }

      if (data.taggedUserIds && data.taggedUserIds.length > 0) {
        postData.taggedUserIds = data.taggedUserIds;
      }

      if (data.gif) {
        postData.gif = data.gif;
      }

     

      console.log(' update - Sending payload:', postData);

      const response = await this.axios.patch<{ message: string; data: any }>(
        POST_ENDPOINTS.UPDATE_POST(postId), 
        postData
      );

      const backendPost = response.data.data;
      console.log(' update - Backend response:', {
        id: backendPost._id,
        backgroundColor: backendPost.backgroundColor,
        content: backendPost.content?.substring(0, 50),
      });
      
      // Usar el método transformBackendPost para consistencia
      const transformedPost = this.transformBackendPost(backendPost);
      console.log(' update - Transformed post:', {
        id: transformedPost.id,
        backgroundColor: transformedPost.backgroundColor,
      });
      
      return transformedPost;
    } catch (error) {
      console.error(' update - Error:', error);
      throw this.handleError(error, 'Error al actualizar post');
    }
  }

  /**
   * Elimina un post
   * 
   * @param postId - ID del post a eliminar
   */
  async delete(postId: string): Promise<void> {
    try {
      await this.axios.delete(POST_ENDPOINTS.DELETE_POST(postId));
    } catch (error) {
      throw this.handleError(error, 'Error al eliminar post');
    }
  }

  /**
   * Agrega o cambia una reacción a un post
   * 
   * @param postId - ID del post
   * @param reactionType - Tipo de reacción
   * @returns Post actualizado
   */
  async react(postId: string, reactionType: ReactionType): Promise<Post> {
    try {
      await this.axios.post(REACTION_ENDPOINTS.CREATE, { 
        postId,
        type: reactionType.toLowerCase()
      });
  
      
      // Recargar el post actualizado

      const updatedPost = await this.getById(postId);

      return updatedPost;
    } catch (error) {
      console.error(' Error en react():', error);
      throw this.handleError(error, 'Error al reaccionar al post');
    }
  }

  /**
   * Quita la reacción de un post
   * 
   * @param postId - ID del post
   * @returns Post actualizado
   */
  async unreact(postId: string): Promise<Post> {
    try {

      await this.axios.delete(REACTION_ENDPOINTS.DELETE(postId));

      
      // Recargar el post actualizado

      const updatedPost = await this.getById(postId);
      return updatedPost;
    } catch (error) {
      console.error(' Error en unreact():', error);
      throw this.handleError(error, 'Error al quitar reacción');
    }
  }

  /**
   * Crea una nueva reacción a un post
   * 
   * @param postId - ID del post
   * @param reactionType - Tipo de reacción
   */
  async createReaction(postId: string, reactionType: ReactionType): Promise<void> {
    try {
   
      await this.axios.post(REACTION_ENDPOINTS.CREATE, { 
        postId,
        type: reactionType.toLowerCase() 
      });
    } catch (error) {
      throw this.handleError(error, 'Error al crear reacción');
    }
  }

  /**
   * Actualiza una reacción existente
   * 
   * @param postId - ID del post
   * @param reactionType - Nuevo tipo de reacción
   */
  async updateReaction(postId: string, reactionType: ReactionType): Promise<void> {
    try {

      await this.axios.patch(REACTION_ENDPOINTS.UPDATE(postId), { 
        type: reactionType.toLowerCase()
      });
    } catch (error) {
      throw this.handleError(error, 'Error al actualizar reacción');
    }
  }

  /**
   * Elimina una reacción de un post
   * 
   * @param postId - ID del post
   */
  async deleteReaction(postId: string): Promise<void> {
    try {
      await this.axios.delete(REACTION_ENDPOINTS.DELETE(postId));
    } catch (error) {
      throw this.handleError(error, 'Error al eliminar reacción');
    }
  }

  /**
   * Agrega un comentario a un post
   * 
   * @param data - Datos del comentario
   * @returns Comentario creado
   */
  async comment(data: CreateCommentDTO): Promise<any> {
    try {
      // TODO: Actualizar cuando el backend tenga el endpoint de comentarios
      const response = await this.axios.post(
        COMMENT_ENDPOINTS.COMMENTS(data.postId),
        { content: data.content }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al comentar');
    }
  }


  async getStatistics(postId: string): Promise<PostStatisticsResponse> {
    try {
      const response = await this.axios.get<PostStatisticsResponse>(
        POST_ENDPOINTS.STATISTICS(postId)
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener estadísticas del post');
    }
  }

  /**
   * Genera presigned URLs para subir archivos a S3
   * 
   * @param request - Lista de archivos para los que generar URLs
   * @returns URLs de subida y CloudFront para cada archivo
   */
  async generateUploadUrls(request: GenerateUploadUrlsRequest): Promise<GenerateUploadUrlsResponse> {
    try {
      console.log(' Generating presigned URLs for:', request.files.length, 'files');
      const response = await this.axios.post<GenerateUploadUrlsResponse>(
        '/api/create-post/generate-upload-urls',
        request
      );
      console.log(' Presigned URLs generated successfully');
      return response.data;
    } catch (error) {
      console.error(' Error generating presigned URLs:', error);
      throw this.handleError(error, 'Error al generar URLs de subida');
    }
  }


  private buildQueryParams(filters?: GetPostsFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    if (filters.type) params.type = filters.type;
    if (filters.visibility) params.visibility = filters.visibility;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    return params;
  }

  /**
   * Maneja errores de HTTP
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error instanceof Error && !error.message.includes('AxiosError')) {
      return error;
    }

    const backendMessage = error?.response?.data?.message;
    if (backendMessage) {
      return new Error(backendMessage);
    }

    return new Error(defaultMessage);
  }
}

/**
 * Instancia singleton del servicio
 */
export const postService = new PostService();
