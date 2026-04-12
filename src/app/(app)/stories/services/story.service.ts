import { getAxiosInstance } from '@/lib/axios/axiosInstance';

// Interfaces según el backend
export interface StoryView {
  userId: string;
  viewedAt: string;
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  s3Key: string;
  type: 'image' | 'video';
  status: 'active' | 'expired';
  createdAt: string;
  expiresAt: string;
  views: StoryView[];
  viewCount: number;
  caption?: string;
  backgroundColor?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  metadata?: {
    deviceType?: string;
    location?: {
      latitude: number;
      longitude: number;
      city?: string;
    };
  };
}

export interface UserStoriesDto {
  userId: string;
  username: string;
  avatarUrl?: string;
  fullName: string;
  stories: Story[];
  unviewedCount: number;
  lastStoryAt: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  s3Key: string;
  cloudFrontUrl: string;
  expiresIn: number;
}

interface ApiResponse<T> {
  message: string;
  data: T;
}

class StoryService {
  private readonly baseUrl = '/api/stories';
  
  private get api() {
    return getAxiosInstance();
  }

  /**
   * Helper para extraer data de la respuesta (maneja ambos formatos)
   */
  private unwrapResponse<T>(response: T | ApiResponse<T>): T {
    // Si tiene la estructura { message, data }, extraer data
    if (response && typeof response === 'object' && 'data' in response && 'message' in response) {
      return (response as ApiResponse<T>).data;
    }
    // Si no, retornar tal cual
    return response as T;
  }

  /**
   * Generar presigned URL para subir archivo a S3
   */
  async generatePresignedUrl(data: {
    fileName: string;
    fileType: string;
    fileSize: number;
    mediaType: 'image' | 'video';
  }): Promise<PresignedUrlResponse> {
    try {
      const response = await this.api.post<PresignedUrlResponse | ApiResponse<PresignedUrlResponse>>(
        `${this.baseUrl}/presigned-url`,
        data
      );
      return this.unwrapResponse(response.data);
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw error;
    }
  }

  /**
   * Subir archivo directamente a S3 usando presigned URL
   */
  async uploadToS3(presignedUrl: string, file: File): Promise<void> {
    try {
      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  }

  /**
   * Crear nueva story en el backend (después de subir a S3)
   */
  async createStory(data: {
    mediaUrl: string;
    s3Key: string;
    type: 'image' | 'video';
    caption?: string;
    mimeType?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    duration?: number;
  }): Promise<Story> {
    try {
      const response = await this.api.post<Story | ApiResponse<Story>>(
        this.baseUrl,
        data
      );
      return this.unwrapResponse(response.data);
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  /**
   * Obtener mis historias activas
   */
  async getMyStories(): Promise<Story[]> {
    try {
      const response = await this.api.get<Story[] | ApiResponse<Story[]>>(
        `${this.baseUrl}/my-stories`
      );
      return this.unwrapResponse(response.data);
    } catch (error) {
      console.error('Error fetching my stories:', error);
      throw error;
    }
  }

  /**
   * Obtener historias de amigos (agrupadas por usuario)
   */
  async getFriendsStories(): Promise<UserStoriesDto[]> {
    try {
      const response = await this.api.get<UserStoriesDto[] | ApiResponse<UserStoriesDto[]>>(
        `${this.baseUrl}/friends`
      );
      return this.unwrapResponse(response.data);
    } catch (error) {
      console.error('Error fetching friends stories:', error);
      throw error;
    }
  }

  /**
   * Incrementar vista en una historia
   */
  async viewStory(storyId: string): Promise<Story> {
    try {
      const response = await this.api.post<Story | ApiResponse<Story>>(
        `${this.baseUrl}/${storyId}/view`
      );
      return this.unwrapResponse(response.data);
    } catch (error) {
      console.error('Error viewing story:', error);
      throw error;
    }
  }

  /**
   * Eliminar una historia
   */
  async deleteStory(storyId: string): Promise<void> {
    try {
      await this.api.delete(`${this.baseUrl}/${storyId}`);
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }
}

export const storyService = new StoryService();

