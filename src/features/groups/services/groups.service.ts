import { getAxiosInstance } from '@/lib/axios/axiosInstance';
import type { Group } from '../types/group.types';

export interface GetGroupsResponse {
  groups: Group[];
  total: number;
}

export interface JoinGroupRequest {
  groupId: string;
}

export interface LeaveGroupRequest {
  groupId: string;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  category: string;
  privacy: 'public' | 'private';
  coverImage?: File;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  category?: string;
  privacy?: 'public' | 'private';
  coverImageUrl?: string;
}

interface PresignedUrlResponse {
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
  cloudFrontUrl: string;
}

class GroupsService {
  private readonly axios = getAxiosInstance();

  /**
   * Obtener mis grupos (grupos a los que pertenezco)
   */
  async getMyGroups(): Promise<Group[]> {
    try {
      const response = await this.axios.get<GetGroupsResponse>('/api/groups/my-groups');
      return response.data.groups;
    } catch (error) {
      console.error('[GroupsService] Error fetching my groups:', error);
      throw error;
    }
  }

  /**
   * Obtener grupos sugeridos basados en intereses
   */
  async getSuggestedGroups(): Promise<Group[]> {
    try {
      const response = await this.axios.get<GetGroupsResponse>('/api/groups/suggested');
      return response.data.groups;
    } catch (error) {
      console.error('[GroupsService] Error fetching suggested groups:', error);
      throw error;
    }
  }

  /**
   * Buscar grupos por query
   */
  async searchGroups(query: string): Promise<Group[]> {
    try {
      const response = await this.axios.get<GetGroupsResponse>('/api/groups/search', {
        params: { q: query },
      });
      return response.data.groups;
    } catch (error) {
      console.error('[GroupsService] Error searching groups:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles de un grupo específico
   */
  async getGroupById(groupId: string): Promise<Group> {
    try {
      const response = await this.axios.get<Group>(`/api/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('[GroupsService] Error fetching group:', error);
      throw error;
    }
  }

  /**
   * Unirse a un grupo
   */
  async joinGroup(groupId: string): Promise<void> {
    try {
      await this.axios.post(`/api/groups/${groupId}/join`, {});
    } catch (error) {
      console.error('[GroupsService] Error joining group:', error);
      throw error;
    }
  }

  /**
   * Salir de un grupo
   */
  async leaveGroup(groupId: string): Promise<void> {
    try {
      await this.axios.post(`/api/groups/${groupId}/leave`, {});
    } catch (error) {
      console.error('[GroupsService] Error leaving group:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo grupo
   */
  async createGroup(data: CreateGroupRequest): Promise<Group> {
    try {
      let coverImageUrl: string | undefined;

      // Si hay imagen, primero obtener presigned URL y subir a S3
      if (data.coverImage) {
        console.log('[GroupsService] Step 1: Requesting presigned URL for:', {
          fileName: data.coverImage.name,
          fileType: data.coverImage.type,
          fileSize: data.coverImage.size,
        });

        const presignedResponse = await this.axios.post<PresignedUrlResponse>(
          '/api/groups/generate-cover-url',
          {
            fileName: data.coverImage.name,
            fileType: data.coverImage.type,
            fileSize: data.coverImage.size,
          }
        );

        console.log('[GroupsService] Step 2: Got presigned response:', presignedResponse.data);

        // Subir archivo directamente a S3 usando la presigned URL
        const uploadResponse = await fetch(presignedResponse.data.uploadUrl, {
          method: 'PUT',
          body: data.coverImage,
          headers: {
            'Content-Type': data.coverImage.type,
          },
        });

        console.log('[GroupsService] Step 3: Upload to S3 status:', uploadResponse.status);

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload image to S3: ${uploadResponse.statusText}`);
        }

        // Usar la CloudFront URL para el grupo
        coverImageUrl = presignedResponse.data.cloudFrontUrl;
        console.log('[GroupsService] Step 4: Will use CloudFront URL:', coverImageUrl);
      }

      // Crear grupo con JSON (no FormData)
      console.log('[GroupsService] Step 5: Creating group with data:', {
        name: data.name,
        description: data.description,
        category: data.category,
        privacy: data.privacy,
        coverImageUrl,
      });

      const response = await this.axios.post<Group>('/api/groups', {
        name: data.name,
        description: data.description,
        category: data.category,
        privacy: data.privacy,
        coverImageUrl,
      });

      console.log('[GroupsService] Step 6: Group created successfully:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('[GroupsService] Error creating group:', error);
      throw error;
    }
  }

  /**
   * Actualizar un grupo existente
   */
  async updateGroup(groupId: string, data: UpdateGroupRequest): Promise<Group> {
    try {
      const response = await this.axios.put<Group>(`/api/groups/${groupId}`, data);
      return response.data;
    } catch (error) {
      console.error('[GroupsService] Error updating group:', error);
      throw error;
    }
  }

  /**
   * Eliminar un grupo
   */
  async deleteGroup(groupId: string): Promise<void> {
    try {
      await this.axios.delete(`/api/groups/${groupId}`);
    } catch (error) {
      console.error('[GroupsService] Error deleting group:', error);
      throw error;
    }
  }
}

export const groupsService = new GroupsService();
